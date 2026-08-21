# Architecture

Browser -> React frontend -> HTTP/JSON -> NestJS controller -> authentication guard -> business service -> PostgreSQL. The browser never connects to PostgreSQL. The worker runs explicit reminder rules and creates at most one notification per enrollment per day.
