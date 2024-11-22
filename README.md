# Better Docker Voting App

- this is a modified version of [dockers official voting app](https://github.com/dockersamples/example-voting-app) 
- when i started working on this i found some things difficult so had to do some adjustment in original code 
- updated images are available in my [docker repo](https://hub.docker.com/repository/docker/luffyxxsenpai/voting/general)
---
### this is a voting application using 4 microservice 
1. Vote: A frontend application where users can vote for their preferred option.
2. Worker: A backend service that processes votes stored in Redis and moves them to a PostgreSQL database.
3. Redis: An in-memory data store used to temporarily store votes.
4. Result: A frontend application that displays the real-time voting results.



