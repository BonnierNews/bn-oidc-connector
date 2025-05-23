FROM node:20-alpine as builder

WORKDIR /opt/app

# Do an in-container install and compile TypeScript
COPY package*.json ./

RUN npm ci 
COPY app.ts ./
COPY lib/ ./lib
COPY @types/ ./@types
COPY config/ ./config
COPY tsconfig.json ./
RUN npm run build && \
    rm -rf ./lib ./app.ts ./tsconfig.json && \
    npm prune --production

FROM node:20-alpine as runtime
WORKDIR /opt/app

COPY config/ ./config
COPY --from=builder /opt/app/dist/ ./dist
COPY --from=builder /opt/app/package.json /opt/app/
COPY --from=builder /opt/app/node_modules/ /opt/app/node_modules/

EXPOSE 3000
ENTRYPOINT [ "node" ]
CMD [ "--import=tsx/esm", "dist/app.js" ]
