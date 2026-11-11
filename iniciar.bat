@echo off
setlocal
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (
  py -3 -c "import sys; assert sys.version_info >= (3,12), 'Instale Python 3.12 ou superior'"
  if errorlevel 1 goto erro
  py -3 -m venv .venv
  if errorlevel 1 goto erro
)
.venv\Scripts\python.exe -c "import sys; assert sys.version_info >= (3,12)"
if errorlevel 1 goto erro
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto erro
echo.
echo Abra http://127.0.0.1:5000 no navegador.
echo Mantenha esta janela aberta. Ctrl+C encerra o servidor.
.venv\Scripts\python.exe serve.py
goto fim
:erro
echo Nao foi possivel iniciar. Consulte a secao Windows do README.md.
pause
:fim
endlocal
