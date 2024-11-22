FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/sdk:7.0 AS build
ARG TARGETPLATFORM
ARG TARGETARCH
ARG BUILDPLATFORM

RUN echo "Building on $BUILDPLATFORM, targeting $TARGETPLATFORM for architecture $TARGETARCH"

WORKDIR /source
COPY *.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c release -o /app --self-contained false --no-restore

FROM mcr.microsoft.com/dotnet/runtime:7.0
WORKDIR /app
COPY --from=build /app .

ENTRYPOINT ["dotnet", "Worker.dll"]

