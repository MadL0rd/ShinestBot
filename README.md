

<p align="center">
  <img src="./documentation/images/logo.svg" width="512" alt="Shinest bot Logo" />
</p>

<p align="left">
  <a href="https://nestjs.com">
    <img src="https://img.shields.io/badge/Nest.js-gray.svg?logo=nestjs&colorB=FF0000&style=for-the-badge"/>
  </a>
  <a href="https://www.mongodb.com">
    <img src="https://img.shields.io/badge/Mongo_Db-gray.svg?logo=mongodb&colorB=133330&style=for-the-badge"/>
  </a>
</p>


  ## Установка
```bash
# локально:
$ npm i

# в контейнере:
$ docker-compose build
```

## Запуск

```bash
# обычный запуск (локально)
$ nest start

# режим разработки (локально)
$ nest start --watch

# запуск в докер контейнере с предварительной сборкой
$ docker-compose up -d --build

## Как смотреть логи
```bash
# внутри контейнера, последние 50 строк консольных логов
$ docker-compose logs --tail 50
```
