# PDF Templates por País

Esta pasta contém os arquivos PDF que serão **mesclados automaticamente** aos documentos gerados na impressão.

## Como usar:

1. **Coloque seus arquivos PDF nesta pasta** com os seguintes nomes:
   - `BR.pdf` - Template para Brasil
   - `CL.pdf` - Template para Chile
   - `AR.pdf` - Template para Argentina
   - `PE.pdf` - Template para Peru

2. **Os PDFs serão mesclados automaticamente** quando você clicar no botão de impressão de um documento.

3. **Ordem de mesclagem:**
   - Primeiro: Páginas do documento gerado (cabeçalho, informações, itens)
   - Depois: Páginas do PDF template do país correspondente

## Exemplo:

Se você tiver um documento do Brasil e existir um arquivo `BR.pdf` nesta pasta:
- O PDF final terá as páginas do documento + as páginas do BR.pdf

## Notas:

- Se não houver PDF template para o país, apenas o documento gerado será baixado
- Os templates são carregados do servidor, então certifique-se de que estão acessíveis
- Você pode atualizar os caminhos no arquivo `.env` se quiser usar outra localização
