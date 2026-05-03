import { describe, it, expect } from 'vitest'
import { semanticCodec } from '../../src/codecs/semantic.js'

describe('semanticCodec', () => {
  it('roundtrips plain text with no keywords', () => {
    const input = Buffer.from('hello world 123')
    const dataPixelCount = 200
    const encoded = semanticCodec.encode(input, dataPixelCount, 20, 20)
    const decoded = semanticCodec.decode(encoded, input.length, 20, 20)
    expect(decoded).toEqual(input)
  })

  it('roundtrips source with keywords', () => {
    const input = Buffer.from('const x = function() { return 42; }')
    const dataPixelCount = 200
    const encoded = semanticCodec.encode(input, dataPixelCount, 20, 20)
    const decoded = semanticCodec.decode(encoded, input.length, 20, 20)
    expect(decoded).toEqual(input)
  })

  it('roundtrips a more complex snippet', () => {
    const input = Buffer.from(
      'class Animal {\n' +
      '  constructor(name) { this.name = name; }\n' +
      '  speak() { return `${this.name} makes a sound.`; }\n' +
      '}\n' +
      "const dog = new Animal('Dog');\n" +
      'for (let i = 0; i < 3; i++) { console.log(dog.speak()); }'
    )
    const dataPixelCount = 1000
    const encoded = semanticCodec.encode(input, dataPixelCount, 40, 40)
    const decoded = semanticCodec.decode(encoded, input.length, 40, 40)
    expect(decoded).toEqual(input)
  })
})
