export interface Style {
  gradient?: {
    from: [number, number, number]
    to: [number, number, number]
    direction: 'horizontal' | 'vertical' | 'diagonal'
  }
  background?: [number, number, number]
  opacity: number
}

export interface HeaderData {
  version: number
  algorithmId: number
  fileLength: number
  width: number
  height: number
  styleFlags: number
  ecLevel: number
  codecMeta: Uint8Array
  gradientFrom: [number, number, number]
  gradientTo: [number, number, number]
  gradientDirection: number
  backgroundOpacity: number
  backgroundColor: [number, number, number]
}

export interface EncodeOptions {
  algo?: string
  style?: Partial<Style>
  width?: number
  out: string
}

export interface DecodeOptions {
  out: string
}
