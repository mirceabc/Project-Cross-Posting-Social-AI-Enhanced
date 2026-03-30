FROM n8nio/n8n:latest

USER root

# Dependencies used in n8n Code node for document extraction.
RUN npm install -g --omit=dev pdf-parse mammoth xlsx

USER node
