// jsPsych の外側で出す画面（開始前のブロック、同意画面、エラー、終了画面）。
// 見た目は DESIGN.md の部品クラス（src/engine/theme.css）だけで作る。

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: { className?: string; text?: string } = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  return node;
}

function page(root: HTMLElement, ...children: HTMLElement[]): HTMLElement {
  const container = el("div", { className: "page" });
  container.append(...children);
  root.replaceChildren(container);
  return container;
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** お知らせ画面。isError が true のときは本文を error-message にする */
export function showMessage(root: HTMLElement, title: string, message: string, isError = false): void {
  page(
    root,
    el("h1", { className: "heading", text: title }),
    el("p", { className: isError ? "error-message" : "", text: message }),
  );
}

/** 同意画面。「同意して参加する」を押すと true、「参加しない」で false。音声再生に必要なクリックも兼ねる */
export function showConsent(
  root: HTMLElement,
  options: { title: string; estimatedMinutes: number; consentText: string },
): Promise<boolean> {
  return new Promise((resolve) => {
    const agree = el("button", { className: "button-primary", text: "同意して参加する" });
    const decline = el("button", { className: "button-secondary", text: "参加しない" });
    agree.addEventListener("click", () => resolve(true));
    decline.addEventListener("click", () => resolve(false));

    const actions = el("div", { className: "actions" });
    actions.append(agree, decline);

    page(
      root,
      el("h1", { className: "heading", text: options.title }),
      el("p", { className: "caption-text", text: `所要時間の目安: 約 ${options.estimatedMinutes} 分` }),
      el("div", { className: "consent-box", text: options.consentText }),
      actions,
    );
  });
}

/** 実験が終わったあとの画面。取り下げのときに必要な参加者コードを、控えられるよう大きく出し続ける */
export function showEnd(root: HTMLElement, participantCode: string | null): void {
  const children: HTMLElement[] = [
    el("h1", { className: "heading", text: "ご協力ありがとうございました" }),
    el("p", { text: "実験は終了しました。このページは閉じて構いません。" }),
  ];
  if (participantCode) {
    children.push(
      el("p", { className: "caption-text", text: "参加者コード（データの取り下げを希望するときに必要です。控えてください）" }),
      el("p", { className: "completion-code", text: participantCode }),
    );
  }
  page(root, ...children);
}
