import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
@Injectable()
export class HttpCustomService{
    constructor(private httpService:HttpService)
    {

    }
    post<T>(url: string, body: any): Promise<AxiosResponse<T>> {
        return lastValueFrom(this.httpService.post<T>(url, body));
    }

    put<T>(url: string, body: any): Promise<AxiosResponse<T>> {
        return lastValueFrom(this.httpService.put<T>(url, body));
    }

    patch<T>(url: string, body: any): Promise<AxiosResponse<T>> {
        return lastValueFrom(this.httpService.patch<T>(url, body));
    }

    get<T>(url: string): Promise<AxiosResponse<T>> {
        return lastValueFrom(this.httpService.get<T>(url));
    }

    
}