# --- build stage ---
FROM golang:1.22-alpine AS build
WORKDIR /src

# Cache de dependencias
COPY go.mod go.sum* ./
RUN go mod download || true

# Código fuente
COPY . .
RUN go build -o /out/api ./cmd/api \
    && go build -o /out/seed ./cmd/seed

# --- runtime stage ---
FROM alpine:3.20
RUN adduser -D -u 10001 appuser
WORKDIR /app
COPY --from=build /out/api /app/api
COPY --from=build /out/seed /app/seed
USER appuser
EXPOSE 8080
ENTRYPOINT ["/app/api"]
