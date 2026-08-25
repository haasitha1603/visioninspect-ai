# Database Schema

## Users

Stores information about registered platform users.

Fields:

- id
- name
- email
- password_hash
- role
- created_at

## Inspections

Stores information about product image inspections.

Fields:

- id
- user_id
- image_name
- image_path
- status
- created_at

## Relationship

One user can create multiple inspection records.

USER
1
│
│
│
*
INSPECTION