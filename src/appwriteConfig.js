import { Client, Databases, Account } from 'appwrite'
import conf from './conf/conf'

const client = new Client();

client
    .setEndpoint(conf.appwriteUrl)
    .setProject(conf.appwriteProjectId);



export const databases = new Databases(client);
export const account = new Account(client);

export default client;