# --- Build Stage ---
# Bu aşama, kodu derlemek ve JAR dosyasını oluşturmak için kullanılır.
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace/app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

# Bağımlılıkları indir ve uygulamayı paketle
RUN ./mvnw install -DskipTests

# --- Package Stage ---
# Bu aşama, sadece çalışmak için gerekli olanları içeren küçük bir imaj oluşturur.
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Derlenmiş JAR dosyasını build aşamasından kopyala
COPY --from=build /workspace/app/target/*.jar app.jar

EXPOSE 8080

# Uygulamayı çalıştır
ENTRYPOINT ["java","-jar","app.jar"]