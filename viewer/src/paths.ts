export const asset = (file: string) => "repo/" + file.split("/").map(encodeURIComponent).join("/");
