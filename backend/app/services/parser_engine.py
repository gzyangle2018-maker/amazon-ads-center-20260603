"""
数据解析引擎 - 读取CSV/XLSX文件，自动检测编码和表头，标准化数据

支持：
- CSV多编码自动检测
- ABA报表前20行扫描真实表头
- Excel多Sheet读取
- 数据清洗（金额、百分比、空值）
- 汇总行识别
"""
import re
import csv
import io
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
import pandas as pd
import numpy as np

from app.services.field_mapper import map_dataframe_columns, get_standard_fields
from app.services.report_classifier import classify_report


# CSV编码检测顺序
CSV_ENCODINGS = ['utf-8-sig', 'utf-8', 'gb18030', 'gbk', 'latin1', 'cp1252']


# 表头关键信号词（用于ABA报表扫描表头位置）
HEADER_SIGNAL_WORDS = [
    "广告活动名称", "客户搜索词", "搜索词", "搜索查询",
    "Search Query", "Search Term", "Campaign Name",
    "（父）ASIN", "（子）ASIN", "ASIN", "Parent ASIN", "Child ASIN",
    "展示量", "点击量", "点击率", "花费", "Impressions", "Clicks", "Spend",
    "日期", "Date", "广告组合名称", "Portfolio",
]


def _count_header_signals(row: list) -> int:
    """计算一行中有多少个表头信号词"""
    if not row:
        return 0
    text = ' '.join(str(v) for v in row if v is not None and not isinstance(v, float) or (isinstance(v, float) and not np.isnan(v)))
    text_lower = text.lower()
    count = 0
    for signal in HEADER_SIGNAL_WORDS:
        if signal.lower() in text_lower:
            count += 1
    return count


def find_header_row(raw_lines: List[str], delimiter: str = ',') -> int:
    """
    扫描前20行，找到真正的表头行

    用于ABA报表等前面有元信息行的CSV文件。
    返回表头行索引（0-based），如果找不到返回0。
    """
    best_idx = 0
    best_score = 0

    for i in range(min(20, len(raw_lines))):
        try:
            reader = csv.reader(io.StringIO(raw_lines[i]), delimiter=delimiter)
            row = next(reader)
            score = _count_header_signals(row)
            if score > best_score:
                best_score = score
                best_idx = i
        except Exception:
            continue

    # 至少需要2个信号词
    if best_score < 2:
        return 0

    return best_idx


def _clean_amount(value: Any) -> float:
    """清洗金额值"""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)

    s = str(value).strip()

    # 去掉货币符号
    s = re.sub(r'^[A-Za-z]{0,3}[\$￥€£¥]?\s*', '', s)

    # 去掉千分位逗号
    if ',' in s and '.' in s:
        last_dot = s.rfind('.')
        last_comma = s.rfind(',')
        if last_comma > last_dot:
            s = s.replace('.', '').replace(',', '.')
        else:
            s = s.replace(',', '')
    elif ',' in s and '.' not in s:
        if s.count(',') == 1 and len(s.split(',')[1]) <= 2:
            s = s.replace(',', '.')
        else:
            s = s.replace(',', '')

    s = s.strip()
    try:
        return float(s)
    except ValueError:
        return 0.0


def _clean_percentage(value: Any) -> float:
    """清洗百分比值，统一返回小数形式"""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return 0.0
    if isinstance(value, (int, float)):
        if abs(value) > 1:
            return value / 100.0
        return float(value)

    s = str(value).strip().replace('%', '').strip()
    try:
        num = float(s)
        if abs(num) > 1:
            num /= 100.0
        return num
    except ValueError:
        return 0.0


def _is_summary_row(row_dict: Dict[str, Any]) -> bool:
    """
    识别汇总行
    """
    shop = str(row_dict.get('marketplace', '') or row_dict.get('shop_name', '')).strip()
    if shop == '总计':
        return True

    search_term = str(row_dict.get('search_term', '')).strip()
    campaign = str(row_dict.get('campaign_name', '')).strip()

    if not search_term and not campaign:
        return True

    if not search_term:
        spend = float(row_dict.get('spend', 0) or 0)
        if spend > 0:
            return True

    return False


def read_csv_file(filepath: str) -> Tuple[pd.DataFrame, str, int]:
    """
    读取CSV文件，自动检测编码和表头

    返回: (DataFrame, 使用的编码, 跳过的行数)
    """
    raw_bytes = Path(filepath).read_bytes()

    last_error = None
    for encoding in CSV_ENCODINGS:
        try:
            text = raw_bytes.decode(encoding)
            lines = text.split('\n')
            lines = [l for l in lines if l.strip()]

            if len(lines) == 0:
                continue

            # 检测分隔符
            sample = '\n'.join(lines[:5])
            delimiter = ','
            if sample.count('\t') > sample.count(','):
                delimiter = '\t'

            # 查找表头
            header_row = find_header_row(lines, delimiter)

            # 读取数据
            data_lines = lines[header_row:]
            if not data_lines:
                continue

            reader = csv.reader(io.StringIO('\n'.join(data_lines)), delimiter=delimiter)
            rows = list(reader)

            if len(rows) < 2:
                continue

            header = rows[0]
            data_rows = rows[1:]

            data_rows = [r for r in data_rows if any(c.strip() if c else False for c in r)]

            df = pd.DataFrame(data_rows, columns=header)
            return df, encoding, header_row

        except Exception as e:
            last_error = e
            continue

    raise ValueError(f"无法解析CSV文件: {filepath}, 最后错误: {last_error}")


def read_excel_file(filepath: str) -> Dict[str, pd.DataFrame]:
    """
    读取Excel文件的所有Sheet

    返回: {Sheet名: DataFrame}
    """
    xls = pd.ExcelFile(filepath)
    sheets = {}

    for sheet_name in xls.sheet_names:
        try:
            df = pd.read_excel(filepath, sheet_name=sheet_name)
            df = df.dropna(how='all').dropna(axis=1, how='all')
            if len(df) > 0:
                sheets[sheet_name] = df
        except Exception as e:
            print(f"读取Sheet '{sheet_name}' 失败: {e}")

    return sheets


def read_file(filepath: str) -> Dict[str, pd.DataFrame]:
    """
    统一读取接口：自动判断CSV/XLSX/XLS

    返回: {Sheet名(CSV则用文件名): DataFrame}
    """
    ext = Path(filepath).suffix.lower()
    filename = Path(filepath).name

    if ext == '.csv':
        df, encoding, skipped = read_csv_file(filepath)
        return {filename: df}
    elif ext in ['.xlsx', '.xls']:
        return read_excel_file(filepath)
    else:
        raise ValueError(f"不支持的文件格式: {ext}")


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    清洗DataFrame:
    1. 标准金额/百分比字段清洗
    2. 空值填充
    3. 汇总行标记
    """
    df = df.copy()

    col_mapping = map_dataframe_columns(df.columns.tolist())

    amount_fields = ['spend', 'sales', 'cpc', 'cpa', 'budget', 'bid',
                     'b2b_sales', 'new_to_brand_sales']

    pct_fields = ['ctr', 'cvr', 'acos', 'roas', 'unit_session_pct',
                  'buy_box_pct', 'refund_rate', 'top_of_search_impression_share',
                  'vtr', 'vctr']

    int_fields = ['impressions', 'clicks', 'orders', 'direct_orders', 'indirect_orders',
                  'units', 'sessions', 'page_views', 'b2b_orders', 'b2b_sessions',
                  'refund_units', 'new_to_brand_orders', 'dpv', 'atc', 'brand_searches',
                  'video_25', 'video_50', 'video_75', 'video_100', 'video_5s', 'video_unmute',
                  'viewable_impressions']

    for orig_col in df.columns:
        std_name = col_mapping.get(orig_col)

        if std_name in amount_fields:
            df[orig_col] = df[orig_col].apply(_clean_amount)
        elif std_name in pct_fields:
            df[orig_col] = df[orig_col].apply(_clean_percentage)
        elif std_name in int_fields:
            df[orig_col] = df[orig_col].apply(
                lambda x: int(float(x)) if pd.notna(x) and str(x).strip() else 0
            )
        else:
            df[orig_col] = df[orig_col].fillna('')

    for orig_col in df.columns:
        std_name = col_mapping.get(orig_col)
        if std_name in amount_fields + pct_fields + int_fields:
            df[orig_col] = pd.to_numeric(df[orig_col], errors='coerce').fillna(0)

    return df


def standardize_dataframe(df: pd.DataFrame, report_type: str = "") -> pd.DataFrame:
    """
    标准化DataFrame:
    1. 重命名列为标准字段名
    2. 只保留标准字段
    3. 添加缺失的标准字段（值为空）
    """
    df = df.copy()
    col_mapping = map_dataframe_columns(df.columns.tolist())

    df = df.rename(columns=col_mapping)

    std_fields = get_standard_fields()
    cols_to_keep = [c for c in df.columns if c in std_fields]
    df = df[cols_to_keep]

    for field in std_fields:
        if field not in df.columns:
            if field in ['spend', 'sales', 'cpc', 'cpa', 'acos', 'roas', 'ctr', 'cvr',
                          'unit_session_pct', 'buy_box_pct', 'refund_rate', 'b2b_sales',
                          'new_to_brand_sales', 'vtr', 'vctr']:
                df[field] = 0.0
            elif field in ['impressions', 'clicks', 'orders', 'units', 'sessions',
                           'page_views', 'video_25', 'video_50', 'video_75', 'video_100',
                           'video_5s', 'video_unmute', 'viewable_impressions', 'dpv', 'atc',
                           'brand_searches', 'refund_units', 'b2b_orders', 'new_to_brand_orders']:
                df[field] = 0
            else:
                df[field] = ''

    ordered = [f for f in std_fields if f in df.columns]
    df = df[ordered]

    df['is_summary'] = df.apply(lambda row: _is_summary_row(row.to_dict()), axis=1)

    df['report_type'] = report_type

    return df


def parse_file(filepath: str) -> Dict[str, Any]:
    """
    完整解析一个文件

    返回: {
        'filename': 文件名,
        'sheets': {Sheet名: {'df': DataFrame, 'report_type': str, 'confidence': float, 'reason': str}},
        'total_rows': int,
        'recognized_sheets': int,
        'unrecognized_sheets': list,
    }
    """
    filename = Path(filepath).name
    sheets_data = read_file(filepath)

    result = {
        'filename': filename,
        'filepath': str(filepath),
        'sheets': {},
        'total_rows': 0,
        'recognized_sheets': 0,
        'unrecognized_sheets': [],
    }

    for sheet_name, df in sheets_data.items():
        df_clean = clean_dataframe(df)

        columns = df_clean.columns.tolist()
        report_type, confidence, reason = classify_report(
            filename=filename,
            sheet_name=sheet_name,
            columns=columns,
        )

        if report_type and confidence >= 0.35:
            df_std = standardize_dataframe(df_clean, report_type)
            result['sheets'][sheet_name] = {
                'df': df_std,
                'report_type': report_type,
                'confidence': confidence,
                'reason': reason,
                'row_count': len(df_std),
            }
            result['recognized_sheets'] += 1
            result['total_rows'] += len(df_std)
        else:
            result['unrecognized_sheets'].append({
                'sheet_name': sheet_name,
                'columns': columns[:20],
                'row_count': len(df_clean),
            })

    return result


def parse_files_batch(filepaths: List[str]) -> List[Dict[str, Any]]:
    """批量解析文件"""
    results = []
    for fp in filepaths:
        try:
            r = parse_file(fp)
            results.append(r)
        except Exception as e:
            results.append({
                'filename': Path(fp).name,
                'filepath': fp,
                'error': str(e),
                'sheets': {},
                'unrecognized_sheets': [],
            })
    return results
