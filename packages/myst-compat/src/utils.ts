export function squeeze<T>(record: Record<string, T | unknown>) {
  Object.keys(record).forEach((key) => {
    if (record[key] === undefined) {
      delete record[key];
    }
  });
}
