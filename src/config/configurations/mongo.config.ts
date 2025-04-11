import { registerAs } from '@nestjs/config';

export default registerAs('mongo', () => {
  const uri = process.env.MONGO_URI;

  return {
    uri,
  };
});
