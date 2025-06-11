// Next.js 向けに Jest の設定を簡単に統合できるユーティリティを読み込む
const nextJest = require('next/jest');

// createJestConfig ... Next.jsプロジェクトのディレクトリを指定してJest設定を拡張できる関数
const createJestConfig = nextJest({
  // Next.js アプリのルートディレクトリを指定（./でカレントディレクトリ）
  dir: './',
});

// Jest のカスタム設定を定義
const customJestConfig = {
  // テストを実行する環境として jsdom を使用（ブラウザのような DOM API が必要な場合）
  testEnvironment: 'jsdom',

  // テスト実行前に呼び出す初期化ファイルを指定（グローバル設定や拡張用）
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // TypeScript を Jest で扱うためのプリセット設定
  preset: 'ts-jest',

  // Jest が解決可能なファイル拡張子を定義（import 文で拡張子を省略可能）
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // node_modules は変換対象から除外（サードパーティライブラリの処理を高速化）
  transformIgnorePatterns: ['^/node_modules/'], // より厳密なパターン

  // エイリアスのパス解決を設定（例: "@/components/..." → "src/components/..." に変換）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

// Jest に Next.js 向けの拡張設定と共に、上で定義したカスタム設定を適用
module.exports = createJestConfig(customJestConfig);
