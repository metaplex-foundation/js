FROM node:16 as node_builder
WORKDIR /solana
RUN wget https://github.com/solana-labs/solana/releases/download/v1.10.32/solana-release-x86_64-unknown-linux-gnu.tar.bz2
RUN tar jxf solana-release-x86_64-unknown-linux-gnu.tar.bz2
ENV PATH="${PATH}:/solana/solana-release/bin"

WORKDIR /metaplex-foundation/js
COPY **.js ./
COPY **.json ./
COPY yarn.lock ./
COPY packages packages
COPY programs programs
RUN yarn install
RUN yarn build

EXPOSE 8900
EXPOSE 8899

CMD ["yarn", "amman:start"]
