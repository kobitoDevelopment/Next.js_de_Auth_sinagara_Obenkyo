export function validateEmail(value: string): string {
  if (value.trim() === "") {
    return "メールアドレスは必須です。";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return "有効なメールアドレスを入力してください。";
  }
  return "";
}

export function validateUsername(value: string): string {
  if (value.trim() === "") {
    return "ユーザー名は必須です。";
  }
  return "";
}

export function validateRole(value: string): string {
  if (value !== "user" && value !== "admin") {
    return "ロールは'user'または'admin'を選択してください。";
  }
  return "";
}

export function validatePassword(value: string): string {
  if (value.trim() === "") {
    return "パスワードは必須です。";
  }
  if (value.length < 8) {
    return "パスワードは8文字以上で入力してください。";
  }
  // 例：英数字混合チェック
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).+$/;
  if (!passwordRegex.test(value)) {
    return "パスワードは英字と数字を含めてください。";
  }
  return "";
}
