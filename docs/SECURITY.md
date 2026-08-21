# Security

Passwords are Argon2id hashes. JWTs carry identity and role claims. Every protected route verifies the JWT, every management route verifies role, and every learner action verifies ownership. The database also blocks invalid relationships and duplicate enrollment.
