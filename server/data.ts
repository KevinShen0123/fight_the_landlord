export interface StringIdDocument {
    _id: string;
  }
  
  
  export interface User extends StringIdDocument {
    username: string;
    score: number; 
  }
  
 
  
  export interface Role {
    name: string;
    permissions: string[];
  }
  

  export interface UserWithRoles extends User {
    roles: Role[];
  }
  
 