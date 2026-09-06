// リンクの表示用にホスト名だけを取り出す(www. は落とす)。URL として不正ならそのまま返す。
export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}
