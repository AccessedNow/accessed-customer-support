import { registerAs } from '@nestjs/config';

export default registerAs('mongo', () => {
  // Sử dụng MongoDB Cloud URI trực tiếp
  const uri =
    process.env.DATABASE_URI ||
    'mongodb+srv://duynguyen:IKg2N5XuyMWv8KiL@cluster0.31drl.mongodb.net/accessed-customer-support?retryWrites=true&w=majority&appName=Cluster0';
  const dbName = process.env.DATABASE_NAME || 'accessed-customer-support';

  return {
    uri,
    dbName,
  };
});
