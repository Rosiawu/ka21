import json
import os
from pathlib import Path

import browser_cookie3
import requests


PROJECT_ROOT = Path.cwd()
TABLE_JSON_PATH = Path("/tmp/feishu-table-decoded.json")
OUTPUT_JSON_PATH = Path("/tmp/feishu-about-submissions.json")
TEAM_IMAGE_DIR = PROJECT_ROOT / "public" / "images" / "team"

FIELD_IDS = {
    "seq": "flddcDkOhN",
    "name": "fldk8tDzsU",
    "title": "fld2EIsdYA",
    "location": "fldRFmnV5O",
    "mbti": "fldtyOjwnt",
    "intro": "fldCrB9PQp",
    "wechat": "fldtYNMZNs",
    "qr": "fldCGFcQUi",
    "avatar": "fldv1tKOo6",
    "keywords": "flduWuNr3r",
    "ai_tools": "fldLjGpJWE",
    "poster_line": "fldqJqP2Q4",
    "consent": "fld8jc91Bd",
}

NAME_TO_ID = {
    "倒放": "daofang",
    "计育韬": "jiyutao",
    "白苏Elliot": "baisuelliot",
    "何先森Kevin": "hexiansenkevin",
    "洛小山": "luoxiaoshan",
    "酸梅煮酒": "suanmeizhujiu",
    "TATALAB": "tatalab",
    "黄啊码": "huangama",
    "云天AI探索": "yuntian",
    "兔会计Scott": "tuhuijiscott",
    "比尔尝百草": "bierchangbaicao",
}


def fail(message: str) -> None:
    raise SystemExit(message)


def text_value(cell) -> str:
    if not cell or cell.get("value") is None:
        return ""

    value = cell["value"]

    if isinstance(value, str):
        return value.strip()

    if isinstance(value, list):
        parts = []
        for item in value:
          parts.append(
              item.get("text")
              or item.get("link")
              or item.get("name")
              or item.get("number")
              or item.get("sequence")
              or ""
          )
        return "".join(parts).strip()

    if isinstance(value, dict) and isinstance(value.get("users"), list):
        return ", ".join(user.get("name", "").strip() for user in value["users"] if user.get("name"))

    return ""


def split_list(value: str):
    if not value:
        return []

    normalized = value.replace("\r", "\n")
    raw_parts = []
    for line in normalized.split("\n"):
        raw_parts.extend(line.replace("，", ",").replace("、", ",").split(","))

    return [part.strip() for part in raw_parts if part.strip()]


def normalize_description(value: str) -> str:
    if not value:
        return ""

    return "\n".join(line.strip() for line in value.replace("\r", "\n").split("\n") if line.strip())


def infer_extension(file_info: dict) -> str:
    name = file_info.get("name", "")
    ext = Path(name).suffix.lower()
    if ext:
        return ext

    mime = file_info.get("mimeType", "")
    if mime == "image/png":
        return ".png"
    if mime == "image/webp":
        return ".webp"
    return ".jpg"


def load_table():
    if not TABLE_JSON_PATH.exists():
        fail(f"Missing required file: {TABLE_JSON_PATH}")

    with TABLE_JSON_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def build_consent_map(field_map: dict):
    options = field_map.get(FIELD_IDS["consent"], {}).get("property", {}).get("options", [])
    return {option["id"]: option["name"] for option in options}


def normalize_rows(table_data: dict):
    consent_map = build_consent_map(table_data.get("fieldMap", {}))
    rows = []

    for record_id, record in table_data.get("recordMap", {}).items():
        name = text_value(record.get(FIELD_IDS["name"]))
        member_id = NAME_TO_ID.get(name)
        if not member_id:
            fail(f"Missing id mapping for name: {name}")

        consent_key = record.get(FIELD_IDS["consent"], {}).get("value")
        consent = consent_map.get(consent_key, "")

        avatar_file = (record.get(FIELD_IDS["avatar"], {}) or {}).get("value", [None])[0]
        qr_file = (record.get(FIELD_IDS["qr"], {}) or {}).get("value", [None])[0]

        rows.append(
            {
                "recordId": record_id,
                "seq": int(text_value(record.get(FIELD_IDS["seq"])) or 0),
                "id": member_id,
                "name": name,
                "title": text_value(record.get(FIELD_IDS["title"])),
                "location": text_value(record.get(FIELD_IDS["location"])),
                "mbti": text_value(record.get(FIELD_IDS["mbti"])),
                "specialty": ",".join(split_list(text_value(record.get(FIELD_IDS["keywords"])))),
                "wechatAccount": text_value(record.get(FIELD_IDS["wechat"])),
                "description": normalize_description(text_value(record.get(FIELD_IDS["intro"]))),
                "aiTools": split_list(text_value(record.get(FIELD_IDS["ai_tools"]))),
                "posterLine": text_value(record.get(FIELD_IDS["poster_line"])),
                "consent": consent,
                "avatar": f"/images/team/avatar-{member_id}{infer_extension(avatar_file)}" if avatar_file else "",
                "wechatQR": f"/images/team/qr-{member_id}{infer_extension(qr_file)}" if qr_file else "",
                "avatarFile": avatar_file,
                "qrFile": qr_file,
            }
        )

    approved = [row for row in rows if row["consent"] in {"同意", "仅网站可用"}]
    approved.sort(key=lambda row: row["seq"])
    return approved


def download_file(session: requests.Session, token: str, output_path: Path) -> None:
    url = f"https://ncnabyevkms5.feishu.cn/space/api/box/stream/download/all/{token}/"
    response = session.get(url, timeout=30)
    response.raise_for_status()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(response.content)


def main() -> None:
    TEAM_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    table_data = load_table()
    rows = normalize_rows(table_data)

    cookie_jar = browser_cookie3.chrome(domain_name="feishu.cn")
    session = requests.Session()
    session.cookies = cookie_jar

    for row in rows:
        if row["avatarFile"]:
            avatar_path = PROJECT_ROOT / "public" / row["avatar"].lstrip("/")
            if not avatar_path.exists():
                print(f"Downloading avatar for {row['name']} -> {avatar_path.relative_to(PROJECT_ROOT)}")
                download_file(session, row["avatarFile"]["attachmentToken"], avatar_path)

        if row["qrFile"]:
            qr_path = PROJECT_ROOT / "public" / row["wechatQR"].lstrip("/")
            if not qr_path.exists():
                print(f"Downloading QR for {row['name']} -> {qr_path.relative_to(PROJECT_ROOT)}")
                download_file(session, row["qrFile"]["attachmentToken"], qr_path)

    with OUTPUT_JSON_PATH.open("w", encoding="utf-8") as handle:
        json.dump(rows, handle, ensure_ascii=False, indent=2)

    print(f"Saved {OUTPUT_JSON_PATH}")
    print(f"Exported {len(rows)} approved submissions")


if __name__ == "__main__":
    main()
