"""
QRIS Dynamic QR Code Generator.
Parses static QRIS data (EMVCo TLV format), injects transaction amount,
converts to dynamic mode, recalculates CRC16, and renders QR code image.
"""
import io
import base64
import qrcode
from typing import Optional


def _crc16_ccitt(data: str) -> str:
    """Calculate CRC16-CCITT for EMVCo QR codes (polynomial 0x1021, init 0xFFFF)."""
    crc = 0xFFFF
    for char in data:
        crc ^= ord(char) << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return format(crc, '04X')


def _parse_tlv(data: str) -> list[tuple[str, str]]:
    """Parse EMVCo TLV (Tag-Length-Value) string into list of (tag, value) tuples."""
    result = []
    pos = 0
    while pos < len(data):
        if pos + 4 > len(data):
            break
        tag = data[pos:pos + 2]
        length = int(data[pos + 2:pos + 4])
        value = data[pos + 4:pos + 4 + length]
        result.append((tag, value))
        pos += 4 + length
    return result


def _build_tlv(entries: list[tuple[str, str]]) -> str:
    """Build EMVCo TLV string from list of (tag, value) tuples."""
    parts = []
    for tag, value in entries:
        parts.append(f"{tag}{len(value):02d}{value}")
    return ''.join(parts)


def generate_dynamic_qris(qris_data: str, amount: int) -> Optional[str]:
    """
    Take a static QRIS data string, inject the amount, and return
    a base64-encoded PNG QR code image.

    Process:
    1. Parse TLV from static QRIS
    2. Change tag 01 from "11" (static) to "12" (dynamic)
    3. Add/update tag 54 with the transaction amount
    4. Remove old CRC (tag 63)
    5. Recalculate CRC16-CCITT and append as tag 63
    6. Generate QR code image and return as base64

    Args:
        qris_data: The raw QRIS EMVCo data string (e.g. "000201010211...")
        amount: Transaction amount in IDR (integer)

    Returns:
        Base64-encoded PNG image string, or None if input is invalid
    """
    if not qris_data or not qris_data.startswith('0002'):
        return None

    try:
        entries = _parse_tlv(qris_data)
    except (ValueError, IndexError):
        return None

    # Rebuild entries with modifications
    new_entries = []
    has_amount = False

    for tag, value in entries:
        # Skip old CRC — we'll recalculate
        if tag == '63':
            continue

        # Change Point of Initiation Method to dynamic (12)
        if tag == '01':
            new_entries.append(('01', '12'))
            continue

        # Update existing amount tag
        if tag == '54':
            amount_str = str(amount)
            new_entries.append(('54', amount_str))
            has_amount = True
            continue

        new_entries.append((tag, value))

    # Add amount tag if not present
    if not has_amount:
        # Insert before tag 55 (tip), 58 (country), or at end
        insert_idx = len(new_entries)
        for i, (tag, _) in enumerate(new_entries):
            if tag in ('55', '58', '59', '60', '61', '62'):
                insert_idx = i
                break
        amount_str = str(amount)
        new_entries.insert(insert_idx, ('54', amount_str))

    # Build payload without CRC
    payload = _build_tlv(new_entries)

    # Add CRC placeholder for calculation: tag=63, length=04, value=????
    payload_for_crc = payload + '6304'
    crc = _crc16_ccitt(payload_for_crc)
    final_payload = payload_for_crc + crc

    # Generate QR code image
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(final_payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return f"data:image/png;base64,{b64}"
