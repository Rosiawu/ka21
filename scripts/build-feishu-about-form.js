const { spawnSync } = require("child_process");

const FORM_TITLE = "KA21 关于我们新朋友信息收集";

const QUESTIONS = [
  { type: "text", title: "对外展示的名字/昵称" },
  { type: "text", title: "一句话身份/头衔" },
  { type: "text", title: "所在地区" },
  { type: "text", title: "MBTI（可留空）" },
  { type: "text", title: "个人简介（建议 1-2 句，第一句最重要）" },
  { type: "text", title: "公众号名称" },
  { type: "upload", title: "公众号二维码（请上传原图）" },
  { type: "upload", title: "头像（请上传清晰原图，方图优先）" },
  { type: "text", title: "擅长方向/关键词（建议 3-5 个）" },
  { type: "text", title: "常用 AI 工具（建议 3-6 个）" },
  { type: "text", title: "希望海报上突出的一句话（可留空）" },
  {
    type: "single",
    title: "是否同意以上信息用于 KA21 网站、海报和社群公开介绍",
  },
];

const CONSENT_OPTIONS = [
  "同意",
  "仅网站可用",
  "仅海报可用",
  "暂不同意公开",
];

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function fail(message) {
  throw new Error(message);
}

function runAppleScript(script) {
  const result = spawnSync("osascript", [], {
    input: script,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const details = result.stderr.trim() || result.stdout.trim();
    throw new Error(details || "AppleScript execution failed");
  }

  return result.stdout.trim();
}

function appleString(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function chromeEval(pageJs) {
  const encoded = Buffer.from(pageJs, "utf8").toString("base64");
  const wrapped = `eval(atob("${encoded}"))`;
  const script = [
    'tell application "Google Chrome"',
    `set out to execute active tab of front window javascript ${appleString(wrapped)}`,
    "end tell",
    "return out",
    "",
  ].join("\n");

  return runAppleScript(script);
}

function chromeJson(pageJs) {
  const output = chromeEval(pageJs);
  return output ? JSON.parse(output) : null;
}

function log(message) {
  console.log(message);
}

function pageHelpers() {
  return `
    const visible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden";
    };

    const sortedCards = () =>
      Array.from(document.querySelectorAll(".base-form-container_card_item"))
        .filter(visible)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

    const sortedAddButtons = () =>
      Array.from(document.querySelectorAll(".base-form-field-insert_web_popfix_add_btn"))
        .filter(visible)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

    const clickLikeUser = (el) => {
      if (!el) return false;
      el.scrollIntoView({ block: "center", inline: "center" });
      ["mouseover", "mousedown", "mouseup", "click"].forEach((type) => {
        el.dispatchEvent(new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
        }));
      });
      return true;
    };
  `;
}

function activeTabUrl() {
  return runAppleScript([
    'tell application "Google Chrome"',
    "return URL of active tab of front window",
    "end tell",
    "",
  ].join("\n"));
}

function ensureFeishuCollectionForm() {
  const url = activeTabUrl();
  if (!url.includes("feishu.cn") || !url.includes("/base/")) {
    fail(`当前标签页不是飞书多维表格收集表: ${url}`);
  }
}

function getQuestionTitles() {
  return chromeJson(`
    (() => {
      ${pageHelpers()}
      return JSON.stringify(
        sortedCards().map((card) => {
          const title = card.querySelector(".form_maker_field_title_value");
          return (title?.innerText || "").replace(/\\s+/g, " ").trim();
        })
      );
    })()
  `);
}

function waitForQuestionCount(expected, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const count = getQuestionTitles().length;
    if (count === expected) {
      return;
    }
    sleep(300);
  }
  fail(`等待题目数量变为 ${expected} 超时`);
}

function setFormTitle(title) {
  const currentTitle = chromeEval(`
    (() => document.querySelector('textarea[placeholder="请输入标题"]')?.value || "")()
  `);

  if (currentTitle === title) {
    return;
  }

  chromeEval(`
    (() => {
      const input = document.querySelector('textarea[placeholder="请输入标题"]');
      if (!input) return "missing-title";
      input.scrollIntoView({ block: "center", inline: "center" });
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      setter.call(input, ${JSON.stringify(title)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      const background = document.querySelector(".base-form-maker-container_content_right") || document.body;
      ["mouseover", "mousedown", "mouseup", "click"].forEach((type) => {
        background.dispatchEvent(new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
        }));
      });
      return input.value;
    })()
  `);
  sleep(500);
}

function renameQuestion(index, title) {
  const existingTitles = getQuestionTitles();
  if (existingTitles[index] === title) {
    return;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    runAppleScript([
      'tell application "Google Chrome"',
      "activate",
      `set focusResult to execute active tab of front window javascript ${appleString(`eval(atob("${Buffer.from(`
        (() => {
          ${pageHelpers()}
          const card = sortedCards()[${index}];
          if (!card) return "missing-card";
          const editor = card.querySelector('textarea[placeholder="输入问题"]');
          if (editor) {
            editor.focus();
            return "focused-editor";
          }
          const titleBox = card.querySelector(".form_maker_field_title");
          if (!titleBox) return "missing-title-box";
          clickLikeUser(titleBox);
          return "clicked-title";
        })()
      `, "utf8").toString("base64")}"))`)}`,
      "end tell",
      "delay 0.4",
      `set the clipboard to ${appleString(title)}`,
      'tell application "System Events"',
      'keystroke "a" using command down',
      "delay 0.1",
      'keystroke "v" using command down',
      "delay 0.1",
      "key code 48",
      "delay 0.1",
      "end tell",
      "delay 0.2",
      'tell application "Google Chrome"',
      `set commitResult to execute active tab of front window javascript ${appleString(`eval(atob("${Buffer.from(`
        (() => {
          const background = document.querySelector(".base-form-maker-container_content_right") || document.body;
          ["mouseover", "mousedown", "mouseup", "click"].forEach((type) => {
            background.dispatchEvent(new MouseEvent(type, {
              bubbles: true,
              cancelable: true,
              view: window,
            }));
          });
          return "committed";
        })()
      `, "utf8").toString("base64")}"))`)}`,
      "end tell",
      "return focusResult & linefeed & commitResult",
      "",
    ].join("\n"));

    sleep(500);

    const titles = getQuestionTitles();
    if (titles[index] === title) {
      return;
    }
  }

  fail(`题目 ${index + 1} 重命名失败: ${title}`);
}

function insertQuestionBeforeLast(questionType, title) {
  const previousCount = getQuestionTitles().length;
  const questionTypeLabel =
    questionType === "text"
      ? "问答题"
      : questionType === "upload"
        ? "文件上传"
        : questionType === "single"
          ? "单选题"
          : null;

  if (!questionTypeLabel) {
    fail(`不支持的题型: ${questionType}`);
  }

  const result = runAppleScript([
    'tell application "Google Chrome"',
    `set beforeCount to execute active tab of front window javascript ${appleString(`eval(atob("${Buffer.from(`
      (() => String(document.querySelectorAll(".base-form-container_card_item").length))()
    `, "utf8").toString("base64")}"))`)}`,
    `set openResult to execute active tab of front window javascript ${appleString(`eval(atob("${Buffer.from(`
      (() => {
        ${pageHelpers()}
        const buttons = sortedAddButtons();
        const target = buttons[buttons.length - 2];
        if (!target) return "missing-add-button";
        clickLikeUser(target);
        return "opened";
      })()
    `, "utf8").toString("base64")}"))`)}`,
    "delay 0.5",
    `set pickResult to execute active tab of front window javascript ${appleString(`eval(atob("${Buffer.from(`
      (() => {
        ${pageHelpers()}
        const all = Array.from(document.querySelectorAll(".base-form-field-insert_web_panel button"))
          .filter(visible);
        const button = all.find(
          (el) => (el.innerText || "").replace(/\\s+/g, " ").trim() === ${JSON.stringify(questionTypeLabel)}
        );
        if (!button) return "missing-type";
        clickLikeUser(button);
        return "clicked";
      })()
    `, "utf8").toString("base64")}"))`)}`,
    "delay 1",
    `set afterCount to execute active tab of front window javascript ${appleString(`eval(atob("${Buffer.from(`
      (() => String(document.querySelectorAll(".base-form-container_card_item").length))()
    `, "utf8").toString("base64")}"))`)}`,
    "end tell",
    "return beforeCount & linefeed & openResult & linefeed & pickResult & linefeed & afterCount",
    "",
  ].join("\n"));

  const afterCount = Number(result.trim().split("\n").at(-1));
  if (afterCount !== previousCount + 1) {
    fail(`插入题目失败，预期数量 ${previousCount + 1}，实际数量 ${afterCount}`);
  }

  sleep(500);
  renameQuestion(previousCount - 1, title);
}

function repairExistingQuestions() {
  const titles = getQuestionTitles();
  if (titles.length < 3 || titles.length > QUESTIONS.length) {
    fail(`当前收集表题目数量异常: ${titles.length}`);
  }

  renameQuestion(0, QUESTIONS[0].title);
  renameQuestion(1, QUESTIONS[1].title);

  for (let i = 2; i < titles.length - 1; i += 1) {
    renameQuestion(i, QUESTIONS[i].title);
  }
}

function buildMissingQuestions() {
  const titles = getQuestionTitles();
  const missing = QUESTIONS.slice(2, -1);

  if (titles.length > QUESTIONS.length) {
    fail(`当前题目数量 ${titles.length} 超出目标数量 ${QUESTIONS.length}`);
  }

  for (let i = titles.length - 1; i < QUESTIONS.length - 1; i += 1) {
    const question = QUESTIONS[i];
    insertQuestionBeforeLast(question.type, question.title);
    log(`已添加: ${question.title}`);
  }
}

function renameConsentQuestion() {
  const lastIndex = getQuestionTitles().length - 1;
  renameQuestion(lastIndex, QUESTIONS[QUESTIONS.length - 1].title);
}

function getConsentOptionCount() {
  return chromeJson(`
    (() => {
      ${pageHelpers()}
      const card = sortedCards().at(-1);
      const count = Array.from(card?.querySelectorAll('textarea[placeholder="请输入选项"]') || [])
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }).length;
      return JSON.stringify(count);
    })()
  `);
}

function setConsentOption(index, value, pressEnter) {
  chromeEval(`
    (() => {
      ${pageHelpers()}
      const card = sortedCards().at(-1);
      const options = Array.from(card?.querySelectorAll('textarea[placeholder="请输入选项"]') || [])
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const option = options[${index}];
      if (!option) return "missing-option";
      option.removeAttribute("readonly");
      option.scrollIntoView({ block: "center", inline: "center" });
      option.focus();
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      setter.call(option, ${JSON.stringify(value)});
      option.dispatchEvent(new Event("input", { bubbles: true }));
      option.dispatchEvent(new Event("change", { bubbles: true }));
      if (${pressEnter ? "true" : "false"}) {
        option.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          bubbles: true,
        }));
        option.dispatchEvent(new KeyboardEvent("keyup", {
          key: "Enter",
          code: "Enter",
          bubbles: true,
        }));
      }
      option.blur();
      return "ok";
    })()
  `);
  sleep(500);
}

function fillConsentOptions() {
  for (let i = 0; i < CONSENT_OPTIONS.length; i += 1) {
    const isLastVisible = i === getConsentOptionCount() - 1;
    setConsentOption(i, CONSENT_OPTIONS[i], isLastVisible && i < CONSENT_OPTIONS.length - 1);
  }

  const options = chromeJson(`
    (() => {
      ${pageHelpers()}
      const card = sortedCards().at(-1);
      const values = Array.from(card?.querySelectorAll('textarea[placeholder="请输入选项"]') || [])
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((el) => (el.value || "").trim())
        .filter(Boolean);
      return JSON.stringify(values);
    })()
  `);

  const matched = CONSENT_OPTIONS.every((value, index) => options[index] === value);
  if (!matched) {
    fail(`单选题选项设置失败，当前选项: ${options.join(" / ")}`);
  }
}

function finalCheck() {
  const titles = getQuestionTitles();
  const titleMatched = titles.length === QUESTIONS.length &&
    QUESTIONS.every((question, index) => titles[index] === question.title);

  if (!titleMatched) {
    fail(`最终题目不匹配: ${JSON.stringify(titles, null, 2)}`);
  }

  log("题目顺序核对完成");
  titles.forEach((title, index) => {
    log(`${index + 1}. ${title}`);
  });
}

function main() {
  ensureFeishuCollectionForm();
  log("已确认当前页是飞书收集表");

  setFormTitle(FORM_TITLE);
  log(`已设置表单标题: ${FORM_TITLE}`);

  repairExistingQuestions();
  buildMissingQuestions();
  renameConsentQuestion();
  fillConsentOptions();
  finalCheck();
}

main();
