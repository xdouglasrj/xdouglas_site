# Retomada

- Parte concluída: prévia fiel do Ian Raposo publicada sob `/ian-raposo`; cartão permanece em `Em desenvolvimento` e agora oferece `Ver prévia`, sem entrar no carrossel de concluídos.
- Acervo incorporado: 23 trabalhos e 143 mídias reais encontradas no projeto de origem; nenhuma obra, texto ou imagem foi inventada.
- Verificado: TypeScript sem erros; navegação real pelo cartão, início e pinturas; acervo e imagens carregados; rotas internas preservam o prefixo `/ian-raposo`; scripts e telemetria da Emergent removidos.
- Build: compilação e checagem de tipos passaram; a geração estática completa parou somente ao acessar o banco local com credenciais inválidas já existentes em `/api/generos`.
- Auditoria: source maps legados removidos e leitura inicial de imagens limitada a 64 KiB por arquivo para evitar cold start lendo o acervo inteiro.
