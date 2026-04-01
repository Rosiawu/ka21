#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "podcast-dashboard"
CONFIG_PATH = DATA_DIR / "config.json"
SNAPSHOTS_PATH = DATA_DIR / "snapshots.json"
EPISODES_CACHE_PATH = DATA_DIR / "episodes-cache.json"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def column_letter(index: int) -> str:
    result = ""
    while index > 0:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result


def xml_text(value: str) -> str:
    return escape(value, {"'": "&apos;", '"': "&quot;"})


def cell_xml(ref: str, value, is_header: bool = False) -> str:
    style_attr = ' s="1"' if is_header else ""
    if value is None:
        return f'<c r="{ref}"{style_attr}/>'

    if isinstance(value, bool):
        numeric = "1" if value else "0"
        return f'<c r="{ref}" t="b"{style_attr}><v>{numeric}</v></c>'

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return f'<c r="{ref}"{style_attr}><v>{value}</v></c>'

    text = str(value).replace("\r\n", "\n").replace("\r", "\n")
    return (
        f'<c r="{ref}" t="inlineStr"{style_attr}>'
        f'<is><t xml:space="preserve">{xml_text(text)}</t></is>'
        f"</c>"
    )


def sheet_xml(rows: list[list[object]]) -> str:
    row_nodes: list[str] = []
    for row_index, row in enumerate(rows, start=1):
        cell_nodes: list[str] = []
        for column_index, value in enumerate(row, start=1):
            ref = f"{column_letter(column_index)}{row_index}"
            cell_nodes.append(cell_xml(ref, value, is_header=row_index == 1))
        row_nodes.append(f'<row r="{row_index}">{"".join(cell_nodes)}</row>')

    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
        '<sheetFormatPr defaultRowHeight="15"/>'
        f'<sheetData>{"".join(row_nodes)}</sheetData>'
        "</worksheet>"
    )


def workbook_xml(sheet_names: list[str]) -> str:
    sheets = []
    for index, name in enumerate(sheet_names, start=1):
        sheets.append(
            f'<sheet name="{xml_text(name)}" sheetId="{index}" '
            f'r:id="rId{index}"/>'
        )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f"<sheets>{''.join(sheets)}</sheets>"
        "</workbook>"
    )


def workbook_rels_xml(sheet_count: int) -> str:
    relations = []
    for index in range(1, sheet_count + 1):
        relations.append(
            f'<Relationship Id="rId{index}" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
            f'Target="worksheets/sheet{index}.xml"/>'
        )
    relations.append(
        f'<Relationship Id="rId{sheet_count + 1}" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" '
        'Target="styles.xml"/>'
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f"{''.join(relations)}"
        "</Relationships>"
    )


def root_rels_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
        'Target="xl/workbook.xml"/>'
        '<Relationship Id="rId2" '
        'Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" '
        'Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" '
        'Target="docProps/app.xml"/>'
        "</Relationships>"
    )


def content_types_xml(sheet_count: int) -> str:
    overrides = [
        '<Override PartName="/xl/workbook.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        '<Override PartName="/xl/styles.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
        '<Override PartName="/docProps/core.xml" '
        'ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
        '<Override PartName="/docProps/app.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    ]
    for index in range(1, sheet_count + 1):
        overrides.append(
            f'<Override PartName="/xl/worksheets/sheet{index}.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        f"{''.join(overrides)}"
        "</Types>"
    )


def styles_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<fonts count="2">'
        '<font><sz val="11"/><name val="Calibri"/></font>'
        '<font><b/><sz val="11"/><name val="Calibri"/></font>'
        "</fonts>"
        '<fills count="2">'
        '<fill><patternFill patternType="none"/></fill>'
        '<fill><patternFill patternType="gray125"/></fill>'
        "</fills>"
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        '<cellXfs count="2">'
        '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
        '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
        "</cellXfs>"
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        "</styleSheet>"
    )


def app_props_xml(sheet_names: list[str]) -> str:
    titles = "".join(
        f'<vt:lpstr>{xml_text(name)}</vt:lpstr>' for name in sheet_names
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        "<Application>Codex</Application>"
        f"<TitlesOfParts><vt:vector size=\"{len(sheet_names)}\" baseType=\"lpstr\">{titles}</vt:vector></TitlesOfParts>"
        "</Properties>"
    )


def core_props_xml() -> str:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        "<dc:creator>Codex</dc:creator>"
        "<cp:lastModifiedBy>Codex</cp:lastModifiedBy>"
        "<dc:title>Podcast Dashboard Export</dc:title>"
        f'<dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>'
        f'<dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>'
        "</cp:coreProperties>"
    )


def parse_episode_no(title: str) -> int | None:
    match = re.match(r"\s*(\d+)\.", title or "")
    return int(match.group(1)) if match else None


def parse_duration_seconds(duration_text: str) -> int | None:
    if not duration_text:
        return None
    parts = duration_text.split(":")
    if len(parts) != 3:
        return None
    hours, minutes, seconds = parts
    try:
        return int(hours) * 3600 + int(minutes) * 60 + int(seconds)
    except ValueError:
        return None


def build_rows():
    config = load_json(CONFIG_PATH)
    snapshots = load_json(SNAPSHOTS_PATH)
    episodes_cache = load_json(EPISODES_CACHE_PATH)

    platforms = config.get("platforms", [])
    platform_lookup = {item["id"]: item for item in platforms}
    platform_ids = [item["id"] for item in platforms]

    episodes = episodes_cache.get("episodes", [])
    episode_lookup = {item["id"]: item for item in episodes}

    latest_snapshot = snapshots[-1] if snapshots else None
    latest_total = (
        sum((latest_snapshot or {}).get("platformTotals", {}).values()) if latest_snapshot else 0
    )

    readme_rows = [
        ["item", "value"],
        ["podcast_name", config.get("showName", "")],
        ["rss_url", config.get("rssUrl", "")],
        ["generated_at_utc", datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")],
        ["source_snapshots_file", str(SNAPSHOTS_PATH.relative_to(ROOT))],
        ["source_episodes_file", str(EPISODES_CACHE_PATH.relative_to(ROOT))],
        ["source_config_file", str(CONFIG_PATH.relative_to(ROOT))],
        ["snapshot_count", len(snapshots)],
        ["episode_count", len(episodes)],
        ["latest_snapshot_date", latest_snapshot.get("date", "") if latest_snapshot else ""],
        ["latest_total_all_platforms", latest_total],
        ["sheet_note_1", "snapshot_summary = 每天一行，适合直接看总量变化"],
        ["sheet_note_2", "snapshot_totals = 每天*平台，一行一条，适合做图表或导入数据库"],
        ["sheet_note_3", "episode_plays = 每天*单集*平台，一行一条，是最核心的明细事实表"],
        ["sheet_note_4", "db_tables 和 db_columns = 我建议的数据库结构"],
    ]

    summary_header = [
        "snapshot_id",
        "snapshot_date",
        "note",
        "created_at_utc",
        "total_all_platforms",
    ] + [f"{platform_id}_plays" for platform_id in platform_ids]
    snapshot_summary_rows = [summary_header]
    for snapshot in snapshots:
        platform_totals = snapshot.get("platformTotals", {})
        snapshot_summary_rows.append(
            [
                snapshot.get("id", ""),
                snapshot.get("date", ""),
                snapshot.get("note", ""),
                snapshot.get("createdAt", ""),
                sum(platform_totals.values()),
            ]
            + [platform_totals.get(platform_id) for platform_id in platform_ids]
        )

    snapshot_totals_rows = [[
        "snapshot_id",
        "snapshot_date",
        "created_at_utc",
        "note",
        "platform_id",
        "platform_name",
        "platform_url",
        "total_plays",
    ]]
    for snapshot in snapshots:
        platform_totals = snapshot.get("platformTotals", {})
        for platform_id in platform_ids:
            if platform_id not in platform_totals:
                continue
            platform = platform_lookup.get(platform_id, {})
            snapshot_totals_rows.append(
                [
                    snapshot.get("id", ""),
                    snapshot.get("date", ""),
                    snapshot.get("createdAt", ""),
                    snapshot.get("note", ""),
                    platform_id,
                    platform.get("name", platform_id),
                    platform.get("url", ""),
                    platform_totals.get(platform_id),
                ]
            )

    episode_plays_rows = [[
        "snapshot_id",
        "snapshot_date",
        "created_at_utc",
        "episode_id",
        "episode_no",
        "episode_title",
        "platform_id",
        "platform_name",
        "play_count",
    ]]
    for snapshot in snapshots:
        for episode_id, platform_values in snapshot.get("episodePlays", {}).items():
            episode = episode_lookup.get(episode_id, {})
            for platform_id, play_count in platform_values.items():
                platform = platform_lookup.get(platform_id, {})
                episode_plays_rows.append(
                    [
                        snapshot.get("id", ""),
                        snapshot.get("date", ""),
                        snapshot.get("createdAt", ""),
                        episode_id,
                        parse_episode_no(episode.get("title", "")),
                        episode.get("title", ""),
                        platform_id,
                        platform.get("name", platform_id),
                        play_count,
                    ]
                )

    episodes_rows = [[
        "episode_id",
        "episode_no",
        "title",
        "pub_date",
        "duration_text",
        "duration_seconds",
        "link",
    ]]
    for episode in episodes:
        title = episode.get("title", "")
        episodes_rows.append(
            [
                episode.get("id", ""),
                parse_episode_no(title),
                title,
                episode.get("pubDate", ""),
                episode.get("duration", ""),
                parse_duration_seconds(episode.get("duration", "")),
                episode.get("link", ""),
            ]
        )

    platforms_rows = [[
        "platform_id",
        "platform_name",
        "platform_url",
    ]]
    for platform in platforms:
        platforms_rows.append(
            [
                platform.get("id", ""),
                platform.get("name", ""),
                platform.get("url", ""),
            ]
        )

    db_tables_rows = [[
        "table_name",
        "purpose",
        "grain",
        "primary_key",
        "foreign_keys",
    ],
        [
            "podcasts",
            "播客主表，一档播客一行",
            "1 row per podcast",
            "podcast_id",
            "",
        ],
        [
            "platforms",
            "平台维表，一档播客下的分发平台",
            "1 row per podcast + platform",
            "platform_id",
            "podcast_id -> podcasts.podcast_id",
        ],
        [
            "episodes",
            "单集维表，一期节目一行",
            "1 row per episode",
            "episode_id",
            "podcast_id -> podcasts.podcast_id",
        ],
        [
            "snapshot_runs",
            "抓取快照主表，一次抓取一行",
            "1 row per snapshot",
            "snapshot_id",
            "podcast_id -> podcasts.podcast_id",
        ],
        [
            "platform_snapshot_totals",
            "平台总播放事实表",
            "1 row per snapshot + platform",
            "(snapshot_id, platform_id)",
            "snapshot_id -> snapshot_runs.snapshot_id; platform_id -> platforms.platform_id",
        ],
        [
            "episode_platform_plays",
            "单集播放明细事实表",
            "1 row per snapshot + episode + platform",
            "(snapshot_id, episode_id, platform_id)",
            "snapshot_id -> snapshot_runs.snapshot_id; episode_id -> episodes.episode_id; platform_id -> platforms.platform_id",
        ],
    ]

    db_columns_rows = [[
        "table_name",
        "column_name",
        "data_type",
        "nullable",
        "key_type",
        "description",
    ],
        ["podcasts", "podcast_id", "text", "N", "PK", "建议固定值，例如 dengxiabai"],
        ["podcasts", "show_name", "text", "N", "", "播客名称"],
        ["podcasts", "rss_url", "text", "Y", "", "RSS 地址"],
        ["platforms", "platform_id", "text", "N", "PK", "平台唯一标识，例如 xiaoyuzhou"],
        ["platforms", "podcast_id", "text", "N", "FK", "所属播客"],
        ["platforms", "platform_name", "text", "N", "", "平台名称"],
        ["platforms", "platform_url", "text", "Y", "", "公开页链接"],
        ["episodes", "episode_id", "text", "N", "PK", "单集唯一标识"],
        ["episodes", "podcast_id", "text", "N", "FK", "所属播客"],
        ["episodes", "episode_no", "integer", "Y", "", "期数，便于排序"],
        ["episodes", "title", "text", "N", "", "标题"],
        ["episodes", "pub_date", "timestamptz", "Y", "", "发布时间"],
        ["episodes", "duration_seconds", "integer", "Y", "", "时长秒数"],
        ["episodes", "source_url", "text", "Y", "", "节目链接"],
        ["snapshot_runs", "snapshot_id", "text", "N", "PK", "抓取唯一标识"],
        ["snapshot_runs", "podcast_id", "text", "N", "FK", "所属播客"],
        ["snapshot_runs", "snapshot_date", "date", "N", "", "按北京时间归档的业务日期"],
        ["snapshot_runs", "created_at_utc", "timestamptz", "N", "", "实际抓取时间"],
        ["snapshot_runs", "note", "text", "Y", "", "备注，例如 自动抓取"],
        ["platform_snapshot_totals", "snapshot_id", "text", "N", "PK/FK", "抓取批次"],
        ["platform_snapshot_totals", "platform_id", "text", "N", "PK/FK", "平台"],
        ["platform_snapshot_totals", "total_plays", "integer", "N", "", "该日该平台总播放"],
        ["episode_platform_plays", "snapshot_id", "text", "N", "PK/FK", "抓取批次"],
        ["episode_platform_plays", "episode_id", "text", "N", "PK/FK", "单集"],
        ["episode_platform_plays", "platform_id", "text", "N", "PK/FK", "平台"],
        ["episode_platform_plays", "play_count", "integer", "N", "", "该日该集在该平台的播放量"],
    ]

    return {
        "README": readme_rows,
        "snapshot_summary": snapshot_summary_rows,
        "snapshot_totals": snapshot_totals_rows,
        "episode_plays": episode_plays_rows,
        "episodes": episodes_rows,
        "platforms": platforms_rows,
        "db_tables": db_tables_rows,
        "db_columns": db_columns_rows,
    }


def write_workbook(output_path: Path, sheets: dict[str, list[list[object]]]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet_names = list(sheets.keys())

    with ZipFile(output_path, "w", ZIP_DEFLATED) as workbook:
        workbook.writestr("[Content_Types].xml", content_types_xml(len(sheet_names)))
        workbook.writestr("_rels/.rels", root_rels_xml())
        workbook.writestr("xl/workbook.xml", workbook_xml(sheet_names))
        workbook.writestr("xl/_rels/workbook.xml.rels", workbook_rels_xml(len(sheet_names)))
        workbook.writestr("xl/styles.xml", styles_xml())
        workbook.writestr("docProps/app.xml", app_props_xml(sheet_names))
        workbook.writestr("docProps/core.xml", core_props_xml())

        for index, rows in enumerate(sheets.values(), start=1):
            workbook.writestr(f"xl/worksheets/sheet{index}.xml", sheet_xml(rows))


def main() -> None:
    parser = argparse.ArgumentParser(description="Export podcast dashboard data into an Excel workbook.")
    parser.add_argument(
        "--output",
        default=str(ROOT / "exports" / f"podcast-dashboard-data-schema-{datetime.now().strftime('%Y-%m-%d')}.xlsx"),
        help="Output .xlsx path",
    )
    args = parser.parse_args()

    output_path = Path(args.output).resolve()
    sheets = build_rows()
    write_workbook(output_path, sheets)

    print(json.dumps(
        {
            "output": str(output_path),
            "sheet_count": len(sheets),
            "sheets": list(sheets.keys()),
            "snapshot_rows": len(sheets["snapshot_summary"]) - 1,
            "episode_play_rows": len(sheets["episode_plays"]) - 1,
        },
        ensure_ascii=False,
        indent=2,
    ))


if __name__ == "__main__":
    main()
