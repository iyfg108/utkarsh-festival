/**
 * Minimal typings for `qrcode-generator`, which ships none of its own.
 * We only use the handful of methods needed to draw the modules ourselves.
 */
declare module 'qrcode-generator' {
  interface QRCode {
    addData(data: string): void
    make(): void
    getModuleCount(): number
    isDark(row: number, col: number): boolean
  }

  /**
   * @param typeNumber 0 picks the smallest version that fits the data.
   * @param errorCorrectionLevel L | M | Q | H
   */
  function qrcode(
    typeNumber: number,
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H',
  ): QRCode

  export = qrcode
}
