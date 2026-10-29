# ---- Estágio 1: build ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Cache de dependências: copia só o pom primeiro
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Copia o código e empacota (pula testes no build da imagem)
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Estágio 2: runtime ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# Usuário não-root
RUN groupadd --system app && useradd --system --gid app app
USER app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENV JAVA_OPTS="-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
