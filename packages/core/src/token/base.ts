import type { Pack } from '../pack/types'

export abstract class PackTokenBase<TSource, TOptions> {
  private cachedPack: Promise<Pack> | null = null

  protected constructor(
    protected readonly source: TSource,
    protected readonly options: TOptions,
  ) {}

  protected abstract decodeSourceToPack(source: TSource, options: TOptions): Promise<Pack>

  pack(): Promise<Pack> {
    this.cachedPack ??= this.decodeSourceToPack(this.source, this.options)

    return this.cachedPack
  }

  async text(path?: string): Promise<string> {
    const pack = await this.pack()

    if (pack.isPack()) {
      if (!path) throw new Error('Token.text(path): path is required for directory packs')

      return pack.text(path)
    }
    if (pack.isDiff()) throw new Error('Token.text(): diff packs do not expose file text')

    return pack.text()
  }

  async blob(path?: string): Promise<Blob> {
    const pack = await this.pack()

    if (pack.isPack()) {
      if (!path) throw new Error('Token.blob(path): path is required for directory packs')

      return pack.blob(path)
    }
    if (pack.isDiff()) throw new Error('Token.blob(): diff packs do not expose file blobs')

    return pack.blob()
  }
}

export abstract class TokenBase<TSource, TOptions> extends PackTokenBase<TSource, TOptions> {
  protected abstract detectSourceAlgorithmName(source: TSource): Promise<string>
  protected abstract createToken(source: TSource, options: TOptions): TokenBase<TSource, TOptions>

  async diff(other: TokenBase<TSource, TOptions> | TSource): Promise<Pack> {
    const otherToken = other instanceof TokenBase ? other : this.createToken(other, this.options)
    const [algoA, algoB] = await Promise.all([
      this.detectSourceAlgorithmName(this.source),
      otherToken.detectSourceAlgorithmName(otherToken.source),
    ])

    if (algoA !== algoB) {
      throw new Error(`diff: source algorithms differ (${algoA} vs ${algoB}); same-algo only`)
    }

    const a = await this.pack()
    const b = await otherToken.pack()

    if (!a.isPack() || !b.isPack()) {
      throw new Error('Token.diff(): both tokens must decode to directory packs')
    }

    const diffResult = await a.diffTo(b)

    return this.createToken(
      (diffResult as { bytes: Uint8Array }).bytes as TSource,
      this.options,
    ).pack()
  }

  async applyDiff(diffToken: TokenBase<TSource, TOptions> | TSource): Promise<Pack> {
    const base = await this.pack()
    const diff = await (
      diffToken instanceof TokenBase ? diffToken : this.createToken(diffToken, this.options)
    ).pack()

    if (!base.isPack()) throw new Error('Token.applyDiff(): source must be a directory pack')
    if (!diff.isDiff()) throw new Error('Token.applyDiff(): diff token must decode to a diff pack')

    return diff.apply(base)
  }
}
