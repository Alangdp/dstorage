# dstorage

Um app de bandeja para mandar arquivos para a nuvem e compartilhar por link.
Você arrasta o arquivo, ele sobe sozinho e o link de download já fica copiado
na sua área de transferência. É só colar onde quiser.

## O que ele faz

- **Envio por arrastar e soltar.** Solte um ou vários arquivos na janela e o envio começa
  na hora. Arquivos grandes são enviados em partes, então não travam o app.
- **Link pronto para compartilhar.** Quando o envio termina, o link é copiado automaticamente.
  Você pode copiá-lo de novo a qualquer momento pela lista de envios.
- **Validade do link.** Em Configurações você escolhe por quantas horas os próximos links
  valem (de 1 a 168 horas, ou seja, até 7 dias). O link nunca dura mais que o arquivo,
  que o servidor apaga depois de um prazo fixo.
- **Histórico.** Os arquivos enviados ficam na lista, com o estado de cada um (enviando,
  concluído, com erro, cancelado). Dá para cancelar um envio em andamento.
- **Fica na bandeja.** O app mora ao lado do relógio e não ocupa a barra de tarefas. Clique
  no ícone para abrir ou esconder a janela. Esc ou o botão X também escondem. O app só
  fecha de verdade pelo menu **Quit** do ícone.
- **Envia em segundo plano.** Pode esconder a janela com envios em andamento. Quando
  terminam (ou falham), o sistema mostra uma notificação.
- **Progresso no ícone.** Durante um envio, o ícone da bandeja ganha uma pilha de 4 blocos
  que vai enchendo conforme o progresso geral.
- **Tema claro e escuro.** O botão de sol/lua no topo alterna entre os dois.
- **Iniciar com o sistema.** Em Configurações dá para marcar para o dstorage abrir sozinho
  quando o computador liga. Ele abre só na bandeja, sem mostrar a janela.

## Diferenças entre os sistemas

O app funciona nos três sistemas, mas a bandeja se comporta de forma diferente em cada um.

### Windows

É onde tudo funciona por completo.

- Clique no ícone da bandeja abre e fecha a janela; clique direito mostra o menu.
- **Arrastar arquivos direto sobre o ícone** abre a janela para você soltar o arquivo.
  Para isso o ícone precisa estar visível na bandeja. Se ele estiver escondido no menu de
  ícones ocultos (a setinha), esse atalho fica desligado. Basta arrastar o ícone para a
  área visível.

### macOS

- O ícone fica na barra de menu, no topo da tela.
- Clique abre e fecha a janela, e o menu tem **Open** e **Quit**.
- Arrastar arquivo direto sobre o ícone ainda não foi testado no Mac. Se não funcionar,
  abra a janela e solte o arquivo lá.

### Linux

- O ícone da bandeja existe, mas **o Linux não avisa o app quando você clica nele**. Por isso
  o menu (clique direito) tem a opção **Open** para abrir a janela, além de **Quit**.
- **Arrastar sobre o ícone não funciona** no Linux. Abra a janela pelo menu e solte o arquivo nela.
- Dependendo do ambiente de desktop, a bandeja pode exigir uma extensão (no GNOME, por exemplo,
  é preciso a extensão de indicadores de aplicativos).

## Como ele funciona por trás

O dstorage não guarda nada no seu computador além do histórico e das suas preferências.
Os arquivos vão para um servidor próprio ([dstorage-server](../golang-serividor-dstorage)),
que cuida do armazenamento na nuvem e gera os links. Sem o servidor rodando, o app não
consegue enviar nada.

As configurações (validade do link, tema, iniciar com o sistema) valem só para este computador.

## Instalação

Baixe o instalador do seu sistema na página de
[Releases](../../releases) e execute.

## Para quem vai mexer no código

Você precisa de [Bun](https://bun.sh), [Rust](https://rustup.rs) e das
[dependências do Tauri](https://tauri.app/start/prerequisites/) para o seu sistema.

```sh
cp .env.example .env     # ajuste VITE_API_URL para o endereço do servidor
bun install
bun run tauri dev        # abre o app em modo desenvolvimento
bun run tauri build      # gera os instaladores
```

Antes de abrir um PR:

```sh
bun run format           # formata e corrige o código (Biome)
cd src-tauri && cargo fmt
```

O GitHub confere formatação, tipos e o build a cada PR. As versões saem sozinhas a partir
das mensagens de commit no padrão `feat:`, `fix:` etc.: ao mergear na `main`, o
[release-please](https://github.com/googleapis/release-please) abre um PR de release, e
mergear esse PR publica a nova versão com os instaladores.
