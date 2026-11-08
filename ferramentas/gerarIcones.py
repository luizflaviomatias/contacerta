"""Gera os ícones PNG do app (fundo verde-azulado com duas barras = duas quinzenas). Só biblioteca padrão."""
import struct
import sys
import zlib
from pathlib import Path

COR_FUNDO = (15, 118, 110)
COR_BARRA = (255, 255, 255)
COR_BARRA_SUAVE = (153, 246, 228)
TAMANHOS = (180, 192, 512)


def cor_do_pixel(x, y, tamanho):
    relativo_x, relativo_y = x / tamanho, y / tamanho
    na_altura_da_barra_alta = 0.25 <= relativo_y <= 0.75
    na_altura_da_barra_baixa = 0.42 <= relativo_y <= 0.75
    if 0.27 <= relativo_x <= 0.45 and na_altura_da_barra_alta:
        return COR_BARRA
    if 0.55 <= relativo_x <= 0.73 and na_altura_da_barra_baixa:
        return COR_BARRA_SUAVE
    return COR_FUNDO


def bloco_png(tipo, dados):
    corpo = tipo + dados
    return struct.pack('>I', len(dados)) + corpo + struct.pack('>I', zlib.crc32(corpo) & 0xFFFFFFFF)


def gerar_png(tamanho):
    linhas = b''.join(
        b'\x00' + b''.join(bytes(cor_do_pixel(x, y, tamanho)) for x in range(tamanho))
        for y in range(tamanho)
    )
    cabecalho = struct.pack('>IIBBBBB', tamanho, tamanho, 8, 2, 0, 0, 0)
    return (b'\x89PNG\r\n\x1a\n' + bloco_png(b'IHDR', cabecalho)
            + bloco_png(b'IDAT', zlib.compress(linhas, 9)) + bloco_png(b'IEND', b''))


if __name__ == '__main__':
    pasta_destino = Path(sys.argv[1])
    for tamanho in TAMANHOS:
        (pasta_destino / f'icone-{tamanho}.png').write_bytes(gerar_png(tamanho))
