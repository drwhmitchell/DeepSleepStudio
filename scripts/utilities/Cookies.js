class Cookies{
    static Get(cookie_name){
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${cookie_name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift(); 
    }
    static Erase(cookie_name){
        document.cookie = cookie_name + '=';
    }
    static Set(cookie_name, data){
        document.cookie = cookie_name + '=' + data;
    }
}