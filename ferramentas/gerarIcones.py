"""Gera os ícones do app (duas barras = duas quinzenas) usando só a biblioteca padrão.

Uso:
  python ferramentas/gerarIcones.py icones                                   # ícones da versão web
  python ferramentas/gerarIcones.py icones android/app/src/main/res          # web + Android
  python ferramentas/gerarIcones.py icones android/app/src/main/res ios/App/App/Assets.xcassets  # web + Android + iOS
"""
import struct
import sys
import zlib
from pathlib import Path

COR_FUNDO = (91, 45, 181, 255)
COR_FUNDO_DA_ABERTURA = (247, 246, 250)
COR_BARRA = (255, 255, 255, 255)
COR_BARRA_DESTAQUE = (255, 176, 32, 255)
TRANSPARENTE = (0, 0, 0, 0)

# Barras em coordenadas relativas ao centro (-0.5 a 0.5), no tamanho cheio (escala 1).
BARRAS = (
    (COR_BARRA, (-0.23, -0.05), (-0.25, 0.25)),
    (COR_BARRA_DESTAQUE, (0.05, 0.23), (-0.08, 0.25)),
)

TAMANHOS_WEB = (180, 192, 512)
# Densidade -> (ícone legado 48dp, camada de frente do ícone adaptável 108dp)
DENSIDADES_ANDROID = {
    'mdpi': (48, 108),
    'hdpi': (72, 162),
    'xhdpi': (96, 216),
    'xxhdpi': (144, 324),
    'xxxhdpi': (192, 432),
}
# A área visível do ícone adaptável é o círculo central de 66dp em 108dp.
ESCALA_DA_FRENTE_ADAPTAVEL = 0.55
# A App Store pede um ícone de 1024px sem transparência; a tela de abertura do iOS é um quadrado de 2732px.
TAMANHO_DO_ICONE_IOS = 1024
TAMANHO_DA_ABERTURA_IOS = 2732
TIPO_PNG_RGB = 2
TIPO_PNG_RGBA = 6


def cor_do_pixel(x, y, tamanho, fundo, escala):
    relativo_x = (x + 0.5) / tamanho - 0.5
    relativo_y = (y + 0.5) / tamanho - 0.5
    for cor, (x_inicio, x_fim), (y_inicio, y_fim) in BARRAS:
        dentro_x = x_inicio * escala <= relativo_x <= x_fim * escala
        dentro_y = y_inicio * escala <= relativo_y <= y_fim * escala
        if dentro_x and dentro_y:
            return cor
    return fundo


def bloco_png(tipo, dados):
    corpo = tipo + dados
    return struct.pack('>I', len(dados)) + corpo + struct.pack('>I', zlib.crc32(corpo) & 0xFFFFFFFF)


def montar_png(tamanho, linhas, tipo_de_cor):
    cabecalho = struct.pack('>IIBBBBB', tamanho, tamanho, 8, tipo_de_cor, 0, 0, 0)
    return (b'\x89PNG\r\n\x1a\n' + bloco_png(b'IHDR', cabecalho)
            + bloco_png(b'IDAT', zlib.compress(linhas, 9)) + bloco_png(b'IEND', b''))


def gerar_png(tamanho, fundo=COR_FUNDO, escala=1.0):
    linhas = b''.join(
        b'\x00' + b''.join(bytes(cor_do_pixel(x, y, tamanho, fundo, escala)) for x in range(tamanho))
        for y in range(tamanho)
    )
    return montar_png(tamanho, linhas, TIPO_PNG_RGBA)


def gerar_png_sem_transparencia(tamanho):
    linhas = b''.join(
        b'\x00' + b''.join(bytes(cor_do_pixel(x, y, tamanho, COR_FUNDO, 1.0)[:3]) for x in range(tamanho))
        for y in range(tamanho)
    )
    return montar_png(tamanho, linhas, TIPO_PNG_RGB)


def gerar_png_de_cor_unica(tamanho, cor):
    linha = b'\x00' + bytes(cor) * tamanho
    return montar_png(tamanho, linha * tamanho, TIPO_PNG_RGB)


def gerar_icones_web(pasta):
    for tamanho in TAMANHOS_WEB:
        (pasta / f'icone-{tamanho}.png').write_bytes(gerar_png(tamanho))


def gerar_icones_android(pasta_res):
    for densidade, (tamanho_legado, tamanho_frente) in DENSIDADES_ANDROID.items():
        pasta = pasta_res / f'mipmap-{densidade}'
        icone_legado = gerar_png(tamanho_legado)
        (pasta / 'ic_launcher.png').write_bytes(icone_legado)
        (pasta / 'ic_launcher_round.png').write_bytes(icone_legado)
        frente = gerar_png(tamanho_frente, TRANSPARENTE, ESCALA_DA_FRENTE_ADAPTAVEL)
        (pasta / 'ic_launcher_foreground.png').write_bytes(frente)


def gerar_icones_ios(pasta_assets):
    (pasta_assets / 'AppIcon.appiconset' / 'AppIcon-512@2x.png').write_bytes(
        gerar_png_sem_transparencia(TAMANHO_DO_ICONE_IOS))
    abertura = gerar_png_de_cor_unica(TAMANHO_DA_ABERTURA_IOS, COR_FUNDO_DA_ABERTURA)
    for nome in ('splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'):
        (pasta_assets / 'Splash.imageset' / nome).write_bytes(abertura)


if __name__ == '__main__':
    gerar_icones_web(Path(sys.argv[1]))
    if len(sys.argv) > 2:
        gerar_icones_android(Path(sys.argv[2]))
    if len(sys.argv) > 3:
        gerar_icones_ios(Path(sys.argv[3]))
