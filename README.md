

# Replicação Ativa em Tolerância a Falhas

O projeto consiste em uma aplicação tolerante a falhas baseada na tecnologia de replicação ativa, onde todas as bases são idependentes, recebendo requests e enviando responses;

## Tecnologias utilizadas

- [NGINX](https://www.nginx.com)
- [NX](https://nx.dev)
- [Nest](https://nestjs.com)
- [Express](https://expressjs.com)
- [Node](https://nodejs.org)


## Informações importantes
Para entender os próximos passos:
- Todas as instâncias são independentes
- As instâncias estão expostas no mesmo host, em portas distintas
- Com as instâncias em portas distintas, a configuração do NGINX se faz necessária para garantir a transparência do Client sobre a disponibilidade da aplicação.

## Instalação e Configuração em SO Ubuntu
### NGINX
Executar `sudo apt update` e em sequência `sudo apt install nginx` para instalar o nginx.
Executar `sudo ufw allow 'Nginx HTTP'` para liberacao do http do nginx no firewall.

Para poder customizar as configurações default do nginx rodar os comandos:

- `sudo unlink /etc/nginx/sites-enabled/default`
- `cd /etc/nginx/sites-available`
- `sudo nano reverse-proxy.conf`

> Após rodar os comandos abrirá o nano para descrever a nova configuração do NGINX

No nano colar a seguinte configuração:

```
http {
	upstream backend {
		least_conn;
		server 127.0.0.1:3333;
		server 127.0.0.1:3332 backup;
		server 127.0.0.1:3331 backup;
	}
	server {
		listen 3000;
		location / {
			proxy_pass http://backend;
		}
	}
}
```

Adicionar a mesma configuração no arquivo nginx.conf, para isso:
Executar `sudo nano /etc/nginx/nginx.conf` e colar dentro do arquivo a mesma configuração.

> Interessante tomar cuidado nesse ponto pois a tag http já existe dentro do arquivo nginx.conf, portanto deve-se colar apenas o conteúdo contigo dentro da tag http, no nosso caso é a tag upstream e server, exemplo:

```
	upstream backend {
		least_conn;
		server 127.0.0.1:3333;
		server 127.0.0.1:3332 backup;
		server 127.0.0.1:3331 backup;
	}

	server {
		listen 3000;
		location / {
			proxy_pass http://backend;
		}
	}
```
Finalizado as configurações do NGINX é necessário fazer um restart do serviço, para isso:
Executar `sudo service nginx restart` para reiniciar o serviço e a configuração do Nginx está concluída.

###Aplicação

Dependências:
- Instalar NodeJs
  - `sudo apt install nodejs`
- Instalar NX
  - `npm install -g nx`
- Intalar git
  - `sudo apt install git`
- Intalar postman
  - `sudo apt install postman`


Pra configurar a aplicação precisamos primeiro fazer um clone deste repositório, para isso:
Executar `git clone https://github.com/ronamanfredini/cc-fault-tolerance-final-assignment.git` na sua pasta de preferência.

Com o clone da aplicação realizado, acesse a pasta da aplicação, rode o seguinte comando para realizar a instalação das dependências `npm install`.

Depois de ter tudo instalado e a aplicação configurada, pode-se então subir as 3 instâncias das bases separadamente. Pra facilitar, abra 3 linhas de comando no diretório da aplicação e execute:

- `./startup.sh`
- `./startup-2.sh`
- `./startup-3.sh`

E a aplicação estará rodando normalmente.

## Utilização da Aplicação

Com a aplicação rodando a utilização é simples, com a ajuda do postman instalado anteriormente faça as requisições para localhost:3000.

Com o método POST podemos salvar qualquer dado nas bases, basta efetuar uma requisição do tipo POST para localhost:3000 com um body em JSON que toda informação contida no body será salva com um id sequencial. Para consultar a informação salva anteriormente basta enfetuar uma requisição do tipo GET passando o id na URI: `localhost:3000/{id}`



