export function jsonBigInt<T>(data: T) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}