//声明一个外部模块 tiny-tfidf。因为这个库是 JavaScript 写的，没有内置类型，所以用 declare module 手动告诉 TypeScript："这个模块长这样"。
declare module 'tiny-tfidf' {
  export class Corpus {
    constructor(
      names: string[],//文档标识符
      texts: string[],//文档内容
      options?: {
        useDefaultStopwords?: boolean//是否使用内置停用词列表
        customStopwords?: string[]//要添加或专门使用的额外停用词
        K1?: number//BM25参数
        b?: number//平滑因子
      }
    )
    getDocumentIdentifiers(): string[]
    getTopTermsForDocument(identifier: string, maxTerms?: number): [string, number][]
  }

  export class Similarity {
    constructor(corpus: Corpus)
    getDistanceMatrix(): { identifiers: string[]; matrix: number[][] }
  }
}
