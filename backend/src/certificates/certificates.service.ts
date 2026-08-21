// Script name: certificates.service.ts
// Original location: backend/src/certificates/certificates.service.ts
// What this script is: A NestJS service responsible for issuing, listing, and verifying course completion certificates.
// What it is used for: Generates certificates for completed enrollments, records them in the database, notifies learners, lists a user's certificates, and verifies certificates by code.
// Programming language: TypeScript
// Inputs: enrollmentId (string) for issuing; userId (string) for listing; verification code (string) for verification.
// Outputs: Database rows (certificate records), notification records; method return values (certificate data or query results).
// Where output is saved or sent: database/table (certificates, notifications), returned via HTTP/API when consumed by controllers; console: None; filesystem: None; browser/session storage: None; JSON: None; SMTP: None; Docker service: None; other location: None
// Technologies and services used or interacted with: NestJS, PostgreSQL (via DatabaseService), Node crypto (randomBytes).
// Downstream scripts/files/processes that consume the output: API controllers that call this service; notification delivery workers that process notifications table; frontend consumers that display certificate and verification info.
// Risks and safe change note: Modifying DB queries, idempotency keys, or transaction boundaries can cause duplicate certificates, race conditions, or missed notifications; ensure transactional integrity and preserve idempotency keys when changing SQL or parameters.
// created by: Sadeq Obaid

// Import the Injectable decorator from NestJS used to mark services for dependency injection.
import { Injectable } from '@nestjs/common';
// Import randomBytes from Node's crypto module to create random verification and certificate identifiers.
import { randomBytes } from 'node:crypto';
// Import the DatabaseService which provides query and transaction helpers for database access.
import { DatabaseService } from '../database/database.service.js';

// Apply the Injectable decorator so NestJS can inject this service where needed.
@Injectable()
// Declare and export the CertificatesService class which exposes certificate-related operations.
export class CertificatesService {
  // Constructor receives the DatabaseService via dependency injection and stores it as a readonly property.
  constructor(private readonly database: DatabaseService) {}

  // Define an async method to issue a certificate if the enrollment is eligible.
  async issueIfEligible(enrollmentId: string) {
    // Start a database transaction via the DatabaseService to ensure atomic certificate creation and notification insertion.
    return this.database.transaction(async (client) => {
      // Query to check if a certificate already exists for the given enrollment id to enforce idempotency.
      const existing = await client.query<{
        // The expected returned row has an id column.
        id: string;
        // The certificate_number column is returned to identify the certificate.
        certificate_number: string;
        // The verification_code column is returned for later verification lookups.
        verification_code: string;
        // The issued_at timestamp for ordering and display.
        issued_at: string;
      }>(
        // SQL that selects certificate fields for the enrollment if present.
        `SELECT id, certificate_number, verification_code, issued_at FROM certificates WHERE enrollment_id = $1`,
        // Parameter array binding the enrollmentId into the SQL query.
        [enrollmentId],
      );
      // If an existing certificate row was found, return it immediately (no further action).
      if (existing.rows[0]) return existing.rows[0];
      // Query to lock and fetch the enrollment and related course title to determine eligibility and notification content.
      const enrollment = await client.query<{
        // The learner_id references the user who completed the enrollment.
        learner_id: string;
        // The status field indicates if the enrollment is COMPLETED and therefore eligible.
        status: string;
        // The title of the course for notification content.
        title: string;
      }>(
        // SQL selects learner id, enrollment status, and course title and applies FOR UPDATE to lock the enrollment row.
        `SELECT e.learner_id, e.status, c.title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.id = $1 FOR UPDATE`,
        // Bind the enrollmentId into the query parameters to fetch the specific enrollment.
        [enrollmentId],
      );
      // If no enrollment found or the enrollment is not completed, return null to indicate no certificate issued.
      if (!enrollment.rows[0] || enrollment.rows[0].status !== 'COMPLETED')
        return null;
      // Construct a certificate number prefixed with CTP, the current UTC year, and a random 5-byte hex string (uppercased).
      const certificateNumber = `CTP-${new Date().getUTCFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
      // Generate a verification code using 18 random bytes encoded as hex for security and uniqueness.
      const verificationCode = randomBytes(18).toString('hex');
      // Insert a new certificate record into the certificates table and return the inserted row.
      const certificate = await client.query<{
        // The inserted row's id.
        id: string;
        // The assigned certificate number.
        certificate_number: string;
        // The verification code stored for external verification.
        verification_code: string;
        // The issued_at timestamp generated by the database.
        issued_at: string;
      }>(
        // SQL to insert the enrollment id, certificate number, and verification code and return key fields.
        `INSERT INTO certificates (enrollment_id, certificate_number, verification_code)
         VALUES ($1, $2, $3) RETURNING id, certificate_number, verification_code, issued_at`,
        // Bind parameters for enrollment id, certificate number, and verification code into the insert statement.
        [enrollmentId, certificateNumber, verificationCode],
      );
      // Insert notifications for both in-app and email channels using an idempotency key to prevent duplicate notifications.
      await client.query(
        // SQL to insert two notification rows (IN_APP and EMAIL) and do nothing if the idempotency key already exists.
        `INSERT INTO notifications (recipient_id, channel, status, notification_type, idempotency_key, subject, body)
         VALUES ($1, 'IN_APP', 'PENDING', 'CERTIFICATE_ISSUED', $2, $3, $4),
                ($1, 'EMAIL', 'PENDING', 'CERTIFICATE_ISSUED', $2 || ':email', $3, $4)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        // Provide parameters: recipient id from enrollment, idempotency key scoped to the enrollment, subject and body strings.
        [
          // Use the learner_id from the locked enrollment row as the recipient_id for notifications.
          enrollment.rows[0].learner_id,
          // Compose an idempotency key based on the enrollment id to make notification insertion idempotent.
          `certificate:${enrollmentId}`,
          // Notification subject string indicating availability.
          'Certificate available',
          // Notification body including the course title from the enrollment's joined course row.
          `Your certificate for ${enrollment.rows[0].title} is ready.`,
        ],
      );
      // Return the newly inserted certificate row or null if not present (defensive).
      return certificate.rows[0] ?? null;
    });
  }

  // Define an async method to retrieve all certificates for a given learner ordered by issuance date desc.
  async mine(userId: string) {
    // Query the database to fetch certificate metadata and course title for the specified user.
    return this.database.query<{
      // certificate_number returned for display and identification.
      certificate_number: string;
      // verification_code returned so the client can use it for verification if needed.
      verification_code: string;
      // issued_at timestamp to order and display when the certificate was granted.
      issued_at: string;
      // title of the course for contextual display.
      title: string;
    }>(
      // SQL joins certificates to enrollments and courses to fetch relevant certificate details for the learner, ordered by issued_at descending.
      `SELECT c.certificate_number, c.verification_code, c.issued_at, course.title
       FROM certificates c JOIN enrollments e ON e.id = c.enrollment_id JOIN courses course ON course.id = e.course_id
       WHERE e.learner_id = $1 ORDER BY c.issued_at DESC`,
      // Bind the userId as the learner id parameter.
      [userId],
    );
  }

  // Define an async method to verify a certificate by its verification code and return detailed info.
  async verify(code: string) {
    // Query the database for a single certificate matching the provided verification code along with course title and learner full name.
    return this.database.one<{
      // The certificate number to show publicly.
      certificate_number: string;
      // The issued_at timestamp to indicate when the certificate was granted.
      issued_at: string;
      // The course title for context.
      title: string;
      // The full name of the user who earned the certificate.
      full_name: string;
    }>(
      // SQL joins certificates, enrollments, courses, and users to retrieve certificate validation details by verification code.
      `SELECT c.certificate_number, c.issued_at, course.title, u.full_name
       FROM certificates c JOIN enrollments e ON e.id = c.enrollment_id
       JOIN courses course ON course.id = e.course_id JOIN users u ON u.id = e.learner_id
       WHERE c.verification_code = $1`,
      // Bind the verification code parameter to the query.
      [code],
    );
  }
}
