import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import obterAeroportos from '@salesforce/apex/FlightController.getAeroportos';
import obterInfoAero from '@salesforce/apex/FlightController.getAeroportoById';
import obterDistancia from '@salesforce/apex/FlightController.calculateDistance';
import salvarVoo from '@salesforce/apex/FlightController.criarVoo';

export default class DetalhesVoo extends LightningElement {
    /**
     * Componente: DetalhesVoo (Versão Base)
     *
     * Autor: José Iago Barbosa Alves
     *  
     * Descrição:
     * Este componente LWC é responsável por exibir e gerenciar detalhes de um voo, incluindo informações sobre aeroportos
     * de partida e chegada, seleções de aeroportos, cálculo de distância, e etapas do processo.
     * 
     * Você pode acessar o documento de idealização desse sistema aqui: https://jade-nonah-44.tiiny.site/
     * 
     * Propriedades:
     * - @track aeroportoPartida: Objeto representando o aeroporto de partida.
     * - @track aeroportoChegada: Objeto representando o aeroporto de chegada.
     * - @track opcoesAeroportoPartida: Array de opções para seleção de aeroportos de partida.
     * - @track opcoesAeroportoChegada: Array de opções para seleção de aeroportos de chegada.
     * - @track aeroportoPartidaSelecionado: ID do aeroporto de partida selecionado.
     * - @track aeroportoChegadaSelecionado: ID do aeroporto de chegada selecionado.
     * - @track exibirDetalhesVoo: Flag indicando se os detalhes do voo devem ser exibidos.
     * - @track infobotao: Flag indicando a visibilidade do botão de informações.
     * - @track distancia: Distância calculada entre aeroportos de partida e chegada.
     * - @track etapa: Representação da etapa atual do processo, com valor padrão '-3' (O valor padrão é usado para o icon vir vermelho, sua alteração para "3" faz ele virar verde).
     * 
     * Uso Dinâmico de @track:
     * A anotação @track é utilizada para rastrear automaticamente alterações nessas propriedades,
     * permitindo que o componente reaja dinamicamente a mudanças e atualize a exibição conforme necessário.
     * 
     * Funcionalidades Principais:
     * - Carrega opções de aeroportos via Apex wire para opções de partida e chegada.
     * - Verifica seleções de aeroportos, calcula distância e exibe detalhes do voo.
     * - Utiliza @track para garantir a reatividade do componente às alterações nas propriedades.
     * 
     * Maior problema durante o percurso:
     * - Tive um problema em relação a operação DML de insert.
     * - O log de erro me retornava um erro de "Too Many DML Limit" quando tentavar inserir os dados, no final era só uma notação que eu havia esquecido de tirar(Cacheable=true) do método
     */
    @track aeroportoPartida = {};
    @track aeroportoChegada = {};
    @track opcoesAeroportoPartida = [];
    @track opcoesAeroportoChegada = [];
    @track aeroportoPartidaSelecionado;
    @track aeroportoChegadaSelecionado;
    @track exibirDetalhesVoo = false;
    @track infobotao = true;
    @track distancia;
    @track etapa = '-3';

    // Wire Apex para obter a lista de aeroportos
    @wire(obterAeroportos)
    aeroportosComComprovante({ error, data }) {
        if (data) {
            this.opcoesAeroportoPartida = this.mapearParaOpcoes(data);
            this.opcoesAeroportoChegada = this.mapearParaOpcoes(data);
        } else if (error) {
            console.error('Erro ao buscar aeroportos:', error);
            this.mostrarMensagem('Erro','error','Erro ao buscar aeroportos. Por favor, tente novamente.');
        }
    }

    /**
     * Método: mapearParaOpcoes
     * Converte a lista de aeroportos em opções utilizadas nos componentes de seleção.
     * 
     * @param {Object[]} data - Lista de aeroportos.
     * @returns {Object[]} - Lista de opções de aeroportos.
     */
    mapearParaOpcoes(data) {
        return data.map(aeroporto => ({
            label: aeroporto.IATA__c,
            value: aeroporto.Id
        }));
    }

    /**
     * Método: verificarInformacoes
     * Verifica as seleções de aeroportos e atualiza os atributos correspondentes.
     */
    verificarInformacoes() {
        // Definição do status com verificação ternária
        // Verifica se ambos foram selecionados e se são diferentes.
        this.exibirDetalhesVoo = 
            this.aeroportoPartidaSelecionado && this.aeroportoChegadaSelecionado 
                                             &&
            this.aeroportoPartidaSelecionado != this.aeroportoChegadaSelecionado ? true : false;
        // Define a exibição do botão com base nas seleções
        this.infobotao = 
            this.aeroportoPartidaSelecionado && this.aeroportoChegadaSelecionado 
                                             &&
            this.aeroportoPartidaSelecionado != this.aeroportoChegadaSelecionado ? false : true;
        // Define a etapa com base na exibição dos detalhes do voo
        this.etapa = this.exibirDetalhesVoo ? '3' : '-3';
        // Verifica se deve exibir detalhes do voo
        if (this.exibirDetalhesVoo) {
            //Aqui foi criada algumas promises para fazer um detalhmento do voo de forma assíncrona
            const promises = [
                this.obterDetalhesAeroportoPromise(this.aeroportoPartidaSelecionado),
                this.obterDetalhesAeroportoPromise(this.aeroportoChegadaSelecionado)
            ];
            // Executa as promises em paralelo usando Promise.all
            Promise.all(promises)
                .then(resultados => {
                    // Atualiza atributos com detalhes dos aeroportos
                    this.aeroportoPartida = resultados[0];
                    this.aeroportoChegada = resultados[1];

                    console.log(
                        this.aeroportoPartida.Latitude,
                        this.aeroportoPartida.Longitude,
                        this.aeroportoChegada.Latitude,
                        this.aeroportoChegada.Longitude
                    );

                    this.calcularDistanciaPromise(
                        this.aeroportoPartida.Latitude,
                        this.aeroportoPartida.Longitude,
                        this.aeroportoChegada.Latitude,
                        this.aeroportoChegada.Longitude
                    ).then(result => {
                        this.distancia = Math.round((result/1000) * 100) / 100; // Convertendo metros para km e arredondando para duas casas decimais
                    }).catch(error => { 
                        console.error('Erro ao calcular distância:', error); 
                        mostrarErro('Erro ao calcular distância entre o aeroporto de partida & chegada');
                    });

                }).catch(error => {
                    console.error('Erro ao obter detalhes dos aeroportos:', error);
                    mostrarErro('Erro ao obter detalhes dos aeroportos');
                });
        }
    }
    
    /**
     * Método: calcularDistanciaPromise
     * Calcula a distância entre dois pontos geográficos de forma assíncrona.
     * 
     * @param {number} latitude1 - Latitude do ponto de partida.
     * @param {number} longitude1 - Longitude do ponto de partida.
     * @param {number} latitude2 - Latitude do ponto de chegada.
     * @param {number} longitude2 - Longitude do ponto de chegada.
     * @returns {Promise<number>} - Promise com a distância calculada em metros.
     */
    calcularDistanciaPromise(latitude1, longitude1, latitude2, longitude2) {
        return new Promise((resolve, reject) => {
            obterDistancia({ latitude1: latitude1, longitude1: longitude1, latitude2: latitude2, longitude2: longitude2 }).then(result => resolve(result)).catch(error => reject(error));
        });
    }

    /**
     * Método: handleAeroportoPartidaChange
     * Manipula a alteração do aeroporto de partida selecionado(Acionado no fim da seleção).
     * 
     * @param {object} event - Objeto que representa o evento de alteração.
     *                       - Contém detalhes sobre a alteração, como o novo valor selecionado.
     */
    handleAeroportoPartidaChange(event) {
        const novaSelecao = event.detail.value; 
        if (this.aeroportoChegadaSelecionado === novaSelecao) {
            this.mostrarMensagem('Erro','error','Você já selecionou esse aeroporto como ponto de chegada.');
            this.aeroportoPartidaSelecionado = null;
        } else {
            this.aeroportoPartidaSelecionado = novaSelecao;
        }
        this.verificarInformacoes();
    }

    /**
     * Método: handleAeroportoChegadaChange
     * Manipula a alteração do aeroporto de chegada selecionado(Acionado no fim da seleção).
     * 
     * @param {object} event - Objeto que representa o evento de alteração.
     *                       - Contém detalhes sobre a alteração, como o novo valor selecionado.
     */
    handleAeroportoChegadaChange(event) {
        const novaSelecao = event.detail.value;
        if (this.aeroportoPartidaSelecionado === novaSelecao) {
            this.mostrarMensagem('Erro','error','Você já selecionou esse aeroporto como ponto de partida.');
            this.aeroportoChegadaSelecionado = null;
        } else {
            this.aeroportoChegadaSelecionado = novaSelecao;
        }
        this.verificarInformacoes();
    }
    /**
    * Método: vooData
    * Retorna os dados do voo formatados para exibição na tabela.
    * 
    * @return {Array} - Um array contendo um objeto com os detalhes do voo.
    */
    get vooData() {
        return [{
            id: 1,
            aeroportoPartida: `${this.aeroportoPartida.Name}-(${this.aeroportoPartida.CodIata})`,
            aeroportoChegada: `${this.aeroportoChegada.Name}-(${this.aeroportoChegada.CodIata})`,
            distancia: this.distancia
        }];
    }
    
    /**
    * Método: columns
    * Retorna a configuração das colunas da tabela de detalhes do voo.
    * 
    * @return {Array} - Um array contendo objetos representando as colunas da tabela.
    */
    get columns() {
        return [
            { label: 'Aeroporto de Partida', fieldName: 'aeroportoPartida', type: 'text' },
            { label: 'Aeroporto de Chegada', fieldName: 'aeroportoChegada', type: 'text' },
            { label: 'Distância do Voo (km)', fieldName: 'distancia', type: 'number' }
        ];
    }

    /**
     * Método: handleSalvarVoo
     * Manipula o salvamento de informações do voo (Acionado ao clicar no botão).
     * Verifica se há detalhes do voo a serem salvos, como distância, aeroporto de partida e chegada.
     * Chama o método assíncrono salvarPromise para efetuar o salvamento e exibe mensagens correspondentes.
     */
    handleSalvarVoo() {
        if(this.exibirDetalhesVoo && this.distancia && this.aeroportoPartida.Id && this.aeroportoChegada.Id){
            console.log(`${this.aeroportoPartida.Id},${this.aeroportoChegada.Id},${this.distancia}`);
            this.salvarPromise(
                this.aeroportoPartida.Id.trim(),
                this.aeroportoChegada.Id.trim(),
                this.distancia
            ).then(result => {
                if(result == true){
                    this.mostrarMensagem('Dados salvos com sucesso.','success',
                    'Para mais informações sobre o voo, leia os detalhes do voo.');
                }
            }).catch(error => { 
                console.error('Erro ao salvar dados:', error); 
                this.mostrarMensagem('Erro','error','Erro ao salvar dados.');
            });
        }else{
            this.mostrarMensagem('Erro','error',"Não foi possível salvar, faltam dados.");
        }
    }

    /**
     * Método: salvarPromise
     * Salva informações do voo de forma assíncrona usando um método Apex.
     * 
     * @param {string} partidaID - ID do aeroporto de partida.
     * @param {string} chegadaID - ID do aeroporto de chegada.
     * @param {number} distance - Distância do voo.
     * @returns {Promise<boolean>} - Promise que resolve com true se o salvamento der certo.
     *                             - Rejeita com um erro em caso de falha.
     */
    salvarPromise(partidaID, chegadaID, distance) {
        return new Promise((resolve, reject) => {
            console.log('Preparando salvamento de dados para: ',partidaID,chegadaID,distance);
            salvarVoo({ aeroPartidaID: partidaID, aeroChegadaID: chegadaID, distancia: distance })
                .then(result => {
                    console.log('Voo salvo com sucesso:', result);
                    resolve(result);
                })
                .catch(error => {
                    console.error('Erro ao salvar voo:', error);
                    reject(error);
                });
        });
    }
    
    /**
     * Método: obterDetalhesAeroportoPromise
     * Obtém detalhes de um aeroporto com base em seu ID de forma assíncrona.
     * 
     * @param {string} idAeroporto - ID do aeroporto a ser consultado.
     * @returns {Promise<Object>}  - Promise com detalhes do aeroporto.
     *                             - Em caso de sucesso, resolve com um objeto contendo Name, Id, CodIata, Latitude e Longitude.
     *                             - Em caso de falha, rejeita com uma mensagem de erro.
     */
    obterDetalhesAeroportoPromise(idAeroporto) {
        return new Promise((resolve, reject) => {
            obterInfoAero({ aeroportoId: idAeroporto })
                .then(result => {
                    if (result) {
                        const detalhesAeroporto = {
                            Name: result.Name,
                            Id: result.Id,
                            CodIata: result.IATA__c,
                            Latitude: result.Latitude__c,
                            Longitude: result.Longitude__c
                        };
                        resolve(detalhesAeroporto);
                    } else {
                        console.error('Nenhum detalhe do aeroporto encontrado.');
                        reject('Nenhum detalhe do aeroporto encontrado.');
                    }
                })
                .catch(error => {
                    console.error('Erro ao obter detalhes do aeroporto:', error);
                    reject('Erro ao obter detalhes do aeroporto. Por favor, tente novamente.');
                });
        });
    }

    /**
     * Método: mostrarMensagem
     * Exibe uma mensagem toast na interface do usuário.
     * 
     * @param {string} titulo - Título da mensagem.
     * @param {string} variante - Variante da mensagem (success, error, etc.).
     * @param {string} mensagem - Conteúdo da mensagem.
     */
    mostrarMensagem(titulo,variante,mensagem) {
        const eventoErro = new ShowToastEvent({
            title: titulo,
            message: mensagem,
            variant: variante,
        });
        this.dispatchEvent(eventoErro);
    }
}