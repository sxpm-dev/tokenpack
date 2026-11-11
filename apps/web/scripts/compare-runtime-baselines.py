"""Compare matching successful measurements without mixing workload sizes.
Usage: python3 scripts/compare-runtime-baselines.py BASELINE AFTER
Ratios are paired before/after: >1 means faster after. Native control ratios
are reported alongside token ratios to expose host/run drift.
"""
import collections
import json
import pathlib
import statistics
import sys

before, after = map(pathlib.Path, sys.argv[1:3])

def load(root, name):
    return json.loads((root / name).read_text())

def aggregate(pairs):
    usable = [p for p in pairs if p['beforeMs'] > 0 and p['afterMs'] > 0]
    ratios = [p['beforeMs'] / p['afterMs'] for p in usable]
    return {'pairedCases': len(pairs), 'positiveTimingPairs': len(usable),
            'medianSpeedup': statistics.median(ratios) if ratios else None,
            'fasterOver10Percent': sum(r > 1 / .9 for r in ratios),
            'slowerOver10Percent': sum(r < 1 / 1.1 for r in ratios), 'pairs': pairs}

report = {'before': str(before), 'after': str(after), 'groups': {}}

def compare_rows(name, old, new, key, time):
    old = {key(r): r for r in old}
    pairs = []
    for r in new:
        k = key(r)
        if k in old:
            pairs.append({'case': k, 'beforeMs': time(old[k]), 'afterMs': time(r)})
    report['groups'][name] = aggregate(pairs)

old_static, new_static = load(before, 'results.json'), load(after, 'results.json')
for condition in {r['condition'] for r in old_static}:
    for variant in {r['scenario'] for r in old_static}:
        compare_rows('static/' + condition + '/' + variant,
                     [r for r in old_static if r['condition'] == condition and r['scenario'] == variant],
                     [r for r in new_static if r['condition'] == condition and r['scenario'] == variant],
                     lambda r: r['source'], lambda r: r['totalMs'])
compare_rows('units', load(before, 'units.json')['rows'], load(after, 'units.json')['rows'],
             lambda r: r['name'] + ':' + str(r['bytes']), lambda r: r['medianMs'])
compare_rows('codec-decode', load(before, 'results-extended.json'), load(after, 'results-extended.json'),
             lambda r: r['source'] + ':' + r['codecName'] + ':' + str(r['channels']), lambda r: r['decodeStats']['median'])

old_jobs = {j['id']: j for j in load(before, 'playground-coverage.json')['jobs']}
new_coverage = load(after, 'playground-coverage.json')
report['coverage'] = {'runs': len(new_coverage['jobs']), 'states': dict(collections.Counter(j['status'] for j in new_coverage['jobs'])),
                      'failed': [j['id'] for j in new_coverage['jobs'] if j['status'] != 'passed']}
groups = collections.defaultdict(list)
fingerprints = []

def add(group, case, old, new):
    groups[group].append({'case': case, 'beforeMs': old, 'afterMs': new})

for job in new_coverage['jobs']:
    previous = old_jobs.get(job['id'])
    if not previous or 'file' not in previous or 'file' not in job:
        continue
    a, b = load(before, previous['file']), load(after, job['file'])
    fingerprints.append(a['fingerprint'] == b['fingerprint'])
    if previous['status'] != 'passed' or job['status'] != 'passed':
        continue
    if a['config'] != b['config']:
        raise ValueError('Configuration changed: ' + job['id'])
    scope = b['scope']; ra, rb = a['result'], b['result']
    config = json.loads(b['config'])
    if scope in ('json', 'partial-fetch'):
        old = {r['id']: r for r in ra}
        for r in rb:
            group = scope + '/' + (config['mode'] + '/' if scope == 'partial-fetch' else '') + r['id']
            add(group, job['id'], old[r['id']]['totalMs'], r['totalMs'])
    elif scope in ('apply-diff', 'browser-fetch'):
        tab = config.get('activeTab')
        if tab:
            field = {'source': 'text', 'exact': 'exact', 'script': 'script'}[tab]
            ra, rb = ra[field], rb[field]
        old = dict(ra)
        for key, r in rb:
            if r.get('state') == 'done' and old.get(key, {}).get('state') == 'done':
                add(scope + '/' + ((tab + '/') if tab else '') + key, job['id'], old[key]['row']['median']['totalMs'], r['row']['median']['totalMs'])
    elif scope == 'diff-matrix':
        old = dict(ra)
        for key, r in rb:
            for metric in ('nextTokenMs', 'diffMs'):
                add('matrix/' + metric, key, old[key][metric], r[metric])
    elif scope == 'bench-app' and job['id'].endswith('Native-single'):
        for key, r in rb.items():
            add('app/' + key.split(':')[-1], key, ra[key]['totalMs'], r['totalMs'])
    elif scope == 'scenario':
        if rb and isinstance(rb[0], dict):
            old = {r['variantId']: r for r in ra}
            for r in rb:
                add('scenario/' + job['id'] + '/' + r['variantId'], job['id'], old[r['variantId']]['totalMs'], r['totalMs'])
        else:
            old = dict(ra)
            for key, r in rb:
                if 'row' in r and 'row' in old.get(key, {}):
                    add('scenario/' + config['scenario'] + '/' + key, job['id'], old[key]['row']['totalMs']['median'], r['row']['totalMs']['median'])
for group, pairs in groups.items():
    report['groups'][group] = aggregate(pairs)
report['identicalPlaygroundFixtureFingerprints'] = {'matched': sum(fingerprints), 'checked': len(fingerprints)}
old_prov, new_prov = load(before, 'provenance.json'), load(after, 'provenance.json')
report['identicalStaticSources'] = old_prov['sources'] == new_prov['sources']
(after / 'comparison.json').write_text(json.dumps(report, indent=2) + '\n')
for name, g in report['groups'].items():
    if name.startswith(('json/', 'app/', 'matrix/', 'codec-', 'units', 'browser-fetch/')):
        print(name, g['pairedCases'], 'speedup=', round(g['medianSpeedup'] or 0, 3))
