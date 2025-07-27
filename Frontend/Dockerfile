# Use an official OpenJDK runtime as a parent image
FROM eclipse-temurin:21-jdk-jammy

# Set the working directory in the container
WORKDIR /app

# Copy the Maven wrapper and pom.xml
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Download project dependencies
RUN ./mvnw dependency:go-offline

# Copy the project source
COPY src ./src

# Package the application
RUN ./mvnw package -DskipTests

# Expose port 8080 to the outside world
EXPOSE 8080

# Run the JAR file 
ENTRYPOINT ["java","-jar","target/*.jar"]