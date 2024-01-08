# Multi-Tenancy Architecture Proof of Concept

This project serves as a demonstration and exploration of multi-tenancy architecture within web applications, aiming to provide insight and understanding into its implementation.

## Purpose
This site was developed as a personal project to delve deeper into multi-tenancy architecture. It stands as a "proof of concept" to showcase the application of multi-tenancy design in any web-based system.

## What is Multi-Tenancy?
Multi-tenancy refers to an architectural approach where a single instance or a group of replicas of software serve multiple users or customers (tenants). Each tenant operates within their own isolated workspace, maintaining separate access to data, configurations, and resources while sharing the same infrastructure and application logic. This practice is common in SaaS and cloud services, ensuring data segregation and security for each client.

For detailed information on multi-tenancy, refer to [this article](https://stratoflow.com/multitenancy-introduction/).

![Multi-Tenancy vs Single Tenancy](https://stratoflow.com/wp-content/uploads/2022/03/multitenancy-vs-single-tanancy-1.png)

## Implementation
This proof of concept adopts a single-database multi-tenancy architecture, where both the application and database layers are shared across tenants. Data isolation occurs at the application level, tagging each tenant's resources with their unique ID. While this approach adds complexity to application authorization and data querying, it avoids scalability issues associated with creating new databases for each tenant.

![Single-Database Multi-Tenancy](https://i.imgur.com/dleMicC.png)

## System Architecture
### Frontend
Vue 3 was chosen for the frontend development due to familiarity and suitability for the project's requirements. The project utilizes Vue 3 with Vite and TypeScript.

### Backend
The backend is developed using Express.js with Passport.js for authentication. Currently supporting email and password login, future iterations may incorporate configurable login options for different tenants. Prisma ORM facilitates PostgreSQL data querying.

### Database
PostgreSQL was selected for its similarity to MySQL and the increased usage following the maintenance of a profile management system reliant on PostgreSQL.

![System Architecture](https://i.imgur.com/df2MvCN.png)
