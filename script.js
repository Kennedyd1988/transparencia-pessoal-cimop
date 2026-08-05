let dadosPagina = {};
let dadosFiltrados = [];
let paginaAtual = 1;

const itensPorPagina = 10;

async function carregarJSON(caminho) {
  try {
    const resposta = await fetch(caminho);

    if (!resposta.ok) {
      throw new Error(`Erro ao carregar ${caminho}`);
    }

    return await resposta.json();
  } catch (erro) {
    console.error(erro);
    return [];
  }
}

function statusClasse(status) {
  if (!status) {
    return "status-encerrado";
  }

  const situacao = status.toLowerCase();

  return (
    situacao.includes("vigente") ||
    situacao.includes("publicado") ||
    situacao.includes("em andamento")
  )
    ? "status-vigente"
    : "status-encerrado";
}

function linhaArquivo(caminho) {
  if (!caminho || caminho.trim() === "") {
    return "Não anexado";
  }

  return `
    <a
      href="${caminho}"
      target="_blank"
      rel="noopener noreferrer"
      class="botao"
    >
      Acessar
    </a>
  `;
}

function linhaDetalhes(caminho) {
  if (!caminho || caminho.trim() === "") {
    return "-";
  }

  return `
    <a href="${caminho}" class="botao-secundario">
      Ver detalhes
    </a>
  `;
}

function preencherData() {
  const elemento = document.getElementById("dataHoje");

  if (!elemento) {
    return;
  }

  const data = new Date();

  data.setDate(data.getDate() - 20);

  elemento.textContent = data.toLocaleDateString("pt-BR");
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function aplicarBuscaNosDados(dados, termo) {
  if (!termo) {
    return dados;
  }

  const termoNormalizado = normalizarTexto(termo);

  return dados.filter(item =>
    normalizarTexto(JSON.stringify(item)).includes(termoNormalizado)
  );
}

function filtrarTabelas() {
  const termo =
    document.getElementById("campoBusca")?.value || "";

  if (window.tipoPagina === "cargos") {
    dadosFiltrados = aplicarBuscaNosDados(
      dadosPagina.remuneracao || [],
      termo
    );

    paginaAtual = 1;
    preencherRemuneracao();
    return;
  }

  document.querySelectorAll("tbody tr").forEach(linha => {
    const corresponde = normalizarTexto(
      linha.innerText
    ).includes(normalizarTexto(termo));

    linha.style.display = corresponde ? "" : "none";
  });
}

function preencherRemuneracao() {
  const tabela =
    document.getElementById("tabelaRemuneracao");

  if (!tabela) {
    return;
  }

  if (!dadosFiltrados.length) {
    tabela.innerHTML = `
      <tr>
        <td colspan="6" class="linha-vazia">
          Nenhum cargo localizado para o filtro informado.
        </td>
      </tr>
    `;

    atualizarPaginacao();
    return;
  }

  const inicio =
    (paginaAtual - 1) * itensPorPagina;

  const pagina = dadosFiltrados.slice(
    inicio,
    inicio + itensPorPagina
  );

  tabela.innerHTML = pagina
    .map(item => `
      <tr>
        <td>${item.area ?? "-"}</td>
        <td>${item.cargo ?? "-"}</td>
        <td>${item.natureza ?? "-"}</td>
        <td>${item.vagas ?? "-"}</td>
        <td>${item.cargaHoraria ?? "-"}</td>
        <td>${item.remuneracao ?? "-"}</td>
      </tr>
    `)
    .join("");

  atualizarPaginacao();
}

function atualizarPaginacao() {
  const informacao =
    document.getElementById("infoPagina");

  if (!informacao) {
    return;
  }

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      dadosFiltrados.length / itensPorPagina
    )
  );

  informacao.innerText =
    `Página ${paginaAtual} de ${totalPaginas}`;
}

function paginaAnterior() {
  if (paginaAtual > 1) {
    paginaAtual--;
    preencherRemuneracao();
  }
}

function proximaPagina() {
  const totalPaginas = Math.max(
    1,
    Math.ceil(
      dadosFiltrados.length / itensPorPagina
    )
  );

  if (paginaAtual < totalPaginas) {
    paginaAtual++;
    preencherRemuneracao();
  }
}

function preencherTabelaSimples(
  idTabela,
  dados,
  colunas,
  mensagemVazia
) {
  const tabela = document.getElementById(idTabela);

  if (!tabela) {
    return;
  }

  if (!dados.length) {
    tabela.innerHTML = `
      <tr>
        <td
          colspan="${colunas.length}"
          class="linha-vazia"
        >
          ${mensagemVazia}
        </td>
      </tr>
    `;

    return;
  }

  tabela.innerHTML = dados
    .map(item => `
      <tr>
        ${colunas
          .map(coluna => {
            const valor =
              item[coluna.campo] ?? "-";

            if (coluna.tipo === "status") {
              return `
                <td>
                  <span
                    class="status ${statusClasse(valor)}"
                  >
                    ${valor}
                  </span>
                </td>
              `;
            }

            if (coluna.tipo === "arquivo") {
              return `
                <td>
                  ${linhaArquivo(item[coluna.campo])}
                </td>
              `;
            }

            if (coluna.tipo === "detalhes") {
              return `
                <td>
                  ${linhaDetalhes(item[coluna.campo])}
                </td>
              `;
            }

            return `<td>${valor}</td>`;
          })
          .join("")}
      </tr>
    `)
    .join("");
}

/* ======================================================
   FILTROS ESPECÍFICOS PARA CONCURSOS PÚBLICOS
====================================================== */

function preencherOpcoesFiltrosConcursos(dados) {
  const filtroAno =
    document.getElementById("filtroAno");

  const filtroSituacao =
    document.getElementById("filtroSituacao");

  if (filtroAno) {
    const anos = [
      ...new Set(
        dados
          .map(item => item.ano)
          .filter(valor =>
            valor !== undefined &&
            valor !== null &&
            valor !== ""
          )
      )
    ].sort((a, b) => Number(b) - Number(a));

    filtroAno.innerHTML =
      '<option value="">Todos os anos</option>' +
      anos
        .map(ano =>
          `<option value="${ano}">${ano}</option>`
        )
        .join("");
  }

  if (filtroSituacao) {
    const situacoes = [
      ...new Set(
        dados
          .map(item => item.situacao)
          .filter(valor =>
            valor !== undefined &&
            valor !== null &&
            valor !== ""
          )
      )
    ].sort((a, b) =>
      String(a).localeCompare(
        String(b),
        "pt-BR"
      )
    );

    filtroSituacao.innerHTML =
      '<option value="">Todas as situações</option>' +
      situacoes
        .map(situacao => `
          <option value="${situacao}">
            ${situacao}
          </option>
        `)
        .join("");
  }
}

function aplicarFiltrosConcursos() {
  const dados = dadosPagina.concursos || [];

  const anoSelecionado =
    document.getElementById("filtroAno")
      ?.value || "";

  const numeroPesquisado = normalizarTexto(
    document.getElementById("filtroNumero")
      ?.value
  );

  const objetoPesquisado = normalizarTexto(
    document.getElementById("filtroObjeto")
      ?.value
  );

  const situacaoSelecionada = normalizarTexto(
    document.getElementById("filtroSituacao")
      ?.value
  );

  const resultados = dados.filter(item => {
    const correspondeAoAno =
      !anoSelecionado ||
      String(item.ano) ===
        String(anoSelecionado);

    const correspondeAoNumero =
      !numeroPesquisado ||
      normalizarTexto(item.numero).includes(
        numeroPesquisado
      );

    const correspondeAoObjeto =
      !objetoPesquisado ||
      normalizarTexto(item.objeto).includes(
        objetoPesquisado
      );

    const correspondeASituacao =
      !situacaoSelecionada ||
      normalizarTexto(item.situacao) ===
        situacaoSelecionada;

    return (
      correspondeAoAno &&
      correspondeAoNumero &&
      correspondeAoObjeto &&
      correspondeASituacao
    );
  });

  preencherTabelaSimples(
    "tabelaConcursos",
    resultados,
    [
      { campo: "ano" },
      { campo: "numero" },
      { campo: "objeto" },
      { campo: "dataPublicacao" },
      {
        campo: "situacao",
        tipo: "status"
      },
      {
        campo: "detalhes",
        tipo: "detalhes"
      }
    ],
    "Nenhum registro foi localizado para os parâmetros informados."
  );

  atualizarResultadoFiltroConcursos(
    resultados.length,
    dados.length
  );
}

function atualizarResultadoFiltroConcursos(
  quantidade,
  total
) {
  const elemento =
    document.getElementById("resultadoFiltro");

  if (!elemento) {
    return;
  }

  if (total === 0) {
    elemento.textContent =
      "Nenhum registro disponível para consulta.";

    return;
  }

  if (quantidade === total) {
    elemento.textContent =
      `Exibindo todos os ${total} registros disponíveis.`;

    return;
  }

  if (quantidade === 0) {
    elemento.textContent =
      `Nenhum registro localizado entre os ${total} registros disponíveis.`;

    return;
  }

  if (quantidade === 1) {
    elemento.textContent =
      `1 registro localizado entre os ${total} registros disponíveis.`;

    return;
  }

  elemento.textContent =
    `${quantidade} registros localizados entre os ${total} registros disponíveis.`;
}

function limparFiltrosConcursos() {
  const filtroAno =
    document.getElementById("filtroAno");

  const filtroNumero =
    document.getElementById("filtroNumero");

  const filtroObjeto =
    document.getElementById("filtroObjeto");

  const filtroSituacao =
    document.getElementById("filtroSituacao");

  if (filtroAno) {
    filtroAno.value = "";
  }

  if (filtroNumero) {
    filtroNumero.value = "";
  }

  if (filtroObjeto) {
    filtroObjeto.value = "";
  }

  if (filtroSituacao) {
    filtroSituacao.value = "";
  }

  aplicarFiltrosConcursos();
}

/* ======================================================
   INICIALIZAÇÃO DAS PÁGINAS
====================================================== */

async function iniciarPagina() {
  preencherData();

  if (window.tipoPagina === "cargos") {
    dadosPagina.remuneracao =
      await carregarJSON(
        "dados/remuneracao.json"
      );

    dadosFiltrados =
      dadosPagina.remuneracao;

    preencherRemuneracao();
  }

  if (
    window.tipoPagina ===
    "estagiarios-terceirizados"
  ) {
    preencherTabelaSimples(
      "tabelaEstagiarios",
      await carregarJSON(
        "dados/estagiarios.json"
      ),
      [
        { campo: "ano" },
        { campo: "nome" },
        { campo: "dataContratacao" },
        { campo: "dataTermino" },
        {
          campo: "situacao",
          tipo: "status"
        },
        { campo: "observacao" }
      ],
      "Não houve contratação de estagiários no período consultado."
    );

    preencherTabelaSimples(
      "tabelaTerceirizados",
      await carregarJSON(
        "dados/terceirizados.json"
      ),
      [
        { campo: "ano" },
        { campo: "nome" },
        { campo: "funcao" },
        { campo: "empresa" },
        {
          campo: "situacao",
          tipo: "status"
        },
        { campo: "observacao" }
      ],
      "Não houve contratação de terceirizados no período consultado."
    );
  }

  if (
    window.tipoPagina ===
    "processos-seletivos"
  ) {
    preencherTabelaSimples(
      "tabelaProcessos",
      await carregarJSON(
        "dados/processos-seletivos.json"
      ),
      [
        { campo: "ano" },
        { campo: "numero" },
        { campo: "objeto" },
        { campo: "dataPublicacao" },
        {
          campo: "situacao",
          tipo: "status"
        },
        {
          campo: "detalhes",
          tipo: "detalhes"
        }
      ],
      "Não houve processos seletivos no período consultado."
    );
  }

  if (window.tipoPagina === "concursos") {
    dadosPagina.concursos =
      await carregarJSON(
        "dados/concursos-publicos.json"
      );

    preencherOpcoesFiltrosConcursos(
      dadosPagina.concursos
    );

    aplicarFiltrosConcursos();
  }

  if (
    window.tipoPagina ===
    "detalhe-processo"
  ) {
    preencherTabelaSimples(
      "tabelaDocumentos",
      await carregarJSON(
        window.arquivoDadosDetalhe
      ),
      [
        { campo: "ordem" },
        { campo: "tipo" },
        { campo: "descricao" },
        { campo: "data" },
        {
          campo: "situacao",
          tipo: "status"
        },
        {
          campo: "arquivo",
          tipo: "arquivo"
        }
      ],
      "Não há documentos cadastrados para este processo."
    );
  }

  if (
    window.tipoPagina ===
    "detalhe-concurso"
  ) {
    preencherTabelaSimples(
      "tabelaDocumentos",
      await carregarJSON(
        window.arquivoDadosDetalhe
      ),
      [
        { campo: "ordem" },
        { campo: "tipo" },
        { campo: "descricao" },
        { campo: "data" },
        {
          campo: "situacao",
          tipo: "status"
        },
        {
          campo: "arquivo",
          tipo: "arquivo"
        }
      ],
      "Não há documentos cadastrados para este concurso."
    );
  }
}

/* ======================================================
   EXPORTAÇÃO DOS DADOS
====================================================== */

function obterDadosDasTabelas() {
  const dados = [];

  document
    .querySelectorAll(".bloco")
    .forEach(bloco => {
      const titulo =
        bloco.querySelector("h3")
          ?.innerText || "Seção";

      const tabela =
        bloco.querySelector("table");

      if (!tabela) {
        return;
      }

      const cabecalhos = Array.from(
        tabela.querySelectorAll("thead th")
      ).map(cabecalho =>
        cabecalho.innerText.trim()
      );

      tabela
        .querySelectorAll("tbody tr")
        .forEach(linha => {
          if (
            linha.style.display === "none" ||
            linha.querySelector(".linha-vazia")
          ) {
            return;
          }

          const colunas = Array.from(
            linha.querySelectorAll("td")
          ).map(coluna =>
            coluna.innerText.trim()
          );

          if (
            colunas.length ===
            cabecalhos.length
          ) {
            const item = {
              secao: titulo
            };

            cabecalhos.forEach(
              (cabecalho, indice) => {
                item[cabecalho] =
                  colunas[indice];
              }
            );

            dados.push(item);
          }
        });
    });

  return dados;
}

function baixarArquivo(
  conteudo,
  nomeArquivo,
  tipo
) {
  const blob = new Blob(
    [conteudo],
    { type: tipo }
  );

  const link =
    document.createElement("a");

  const url =
    URL.createObjectURL(blob);

  link.href = url;
  link.download = nomeArquivo;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function nomeBase() {
  return document.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function exportarCSV() {
  const dados = obterDadosDasTabelas();

  if (!dados.length) {
    alert(
      "Nenhum dado disponível para exportação."
    );

    return;
  }

  const colunas = Object.keys(dados[0]);

  const linhas = [
    colunas.join(";"),
    ...dados.map(item =>
      colunas
        .map(coluna => {
          const valor = String(
            item[coluna] ?? ""
          ).replace(/"/g, '""');

          return `"${valor}"`;
        })
        .join(";")
    )
  ];

  baixarArquivo(
    "\uFEFF" + linhas.join("\n"),
    nomeBase() + ".csv",
    "text/csv;charset=utf-8;"
  );
}

function exportarJSON() {
  const dados = obterDadosDasTabelas();

  if (!dados.length) {
    alert(
      "Nenhum dado disponível para exportação."
    );

    return;
  }

  baixarArquivo(
    JSON.stringify(dados, null, 2),
    nomeBase() + ".json",
    "application/json;charset=utf-8;"
  );
}

function exportarXML() {
  const dados = obterDadosDasTabelas();

  if (!dados.length) {
    alert(
      "Nenhum dado disponível para exportação."
    );

    return;
  }

  let xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<registros>\n';

  dados.forEach(item => {
    xml += "  <registro>\n";

    Object.entries(item).forEach(
      ([chave, valor]) => {
        const tag = chave
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            ""
          )
          .replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )
          .toLowerCase();

        const conteudo = String(valor)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        xml +=
          `    <${tag}>${conteudo}</${tag}>\n`;
      }
    );

    xml += "  </registro>\n";
  });

  xml += "</registros>";

  baixarArquivo(
    xml,
    nomeBase() + ".xml",
    "application/xml;charset=utf-8;"
  );
}

function exportarXLSX() {
  const dados = obterDadosDasTabelas();

  if (!dados.length) {
    alert(
      "Nenhum dado disponível para exportação."
    );

    return;
  }

  const planilha =
    XLSX.utils.json_to_sheet(dados);

  const pasta =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    pasta,
    planilha,
    "Dados"
  );

  XLSX.writeFile(
    pasta,
    nomeBase() + ".xlsx"
  );
}

function exportarPDF() {
  const dados = obterDadosDasTabelas();

  const { jsPDF } = window.jspdf;

  const documento =
    new jsPDF("landscape");

  documento.setFontSize(14);

  documento.text(
    document.title,
    14,
    15
  );

  if (!dados.length) {
    documento.text(
      "Nenhum dado disponível para exportação.",
      14,
      30
    );

    documento.save(
      nomeBase() + ".pdf"
    );

    return;
  }

  const colunas =
    Object.keys(dados[0]);

  const linhas = dados.map(item =>
    colunas.map(coluna =>
      item[coluna]
    )
  );

  documento.autoTable({
    head: [colunas],
    body: linhas,
    startY: 25,
    styles: {
      fontSize: 7,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [7, 55, 99]
    }
  });

  documento.save(
    nomeBase() + ".pdf"
  );
}

iniciarPagina();
