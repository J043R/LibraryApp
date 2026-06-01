export function publicUser(row: any) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    age: row.age,
    role: row.role
  };
}

export function bookDto(row: any) {
  if (!row) return null;
  return {
    id: String(row.id),
    title: row.title,
    author: row.author,
    year: row.year,
    image: row.image || '',
    available: Boolean(row.available),
    status: row.available ? 'Доступна' : 'Выдана',
    readerId: row.reader_id === null ? null : String(row.reader_id),
    returnDate: row.return_date
  };
}

export function borrowedBookDto(row: any) {
  return {
    id: String(row.id),
    bookId: String(row.book_id),
    bookTitle: row.book_title,
    bookAuthor: row.book_author,
    readerId: row.reader_id === null ? null : String(row.reader_id),
    readerName: row.reader_name,
    readerEmail: row.reader_email,
    issuedAt: row.issued_at,
    returnDate: row.return_date,
    returnedAt: row.returned_at
  };
}

export function logDto(row: any) {
  return {
    id: String(row.id),
    action: row.action,
    role: row.role,
    details: row.details || '',
    createdAt: row.created_at
  };
}
