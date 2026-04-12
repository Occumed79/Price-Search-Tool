import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { CreateDomainRuleRequest, CreateSearchPresetRequest, DomainRule, ErrorResponse, ExportData, ExportResultsParams, HealthStatus, ManualReview, ManualReviewRequest, MapPin, SaveResultRequest, SavedResult, SearchPreset, SearchRequest, SearchRun, SearchRunWithResults, Stats, SuccessResponse } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Start a new clinic price search
 */
export declare const getStartSearchUrl: () => string;
export declare const startSearch: (searchRequest: SearchRequest, options?: RequestInit) => Promise<SearchRun>;
export declare const getStartSearchMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startSearch>>, TError, {
        data: BodyType<SearchRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof startSearch>>, TError, {
    data: BodyType<SearchRequest>;
}, TContext>;
export type StartSearchMutationResult = NonNullable<Awaited<ReturnType<typeof startSearch>>>;
export type StartSearchMutationBody = BodyType<SearchRequest>;
export type StartSearchMutationError = ErrorType<unknown>;
/**
 * @summary Start a new clinic price search
 */
export declare const useStartSearch: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startSearch>>, TError, {
        data: BodyType<SearchRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof startSearch>>, TError, {
    data: BodyType<SearchRequest>;
}, TContext>;
/**
 * @summary Get search run with results
 */
export declare const getGetSearchUrl: (id: number) => string;
export declare const getSearch: (id: number, options?: RequestInit) => Promise<SearchRunWithResults>;
export declare const getGetSearchQueryKey: (id: number) => readonly [`/api/search/${number}`];
export declare const getGetSearchQueryOptions: <TData = Awaited<ReturnType<typeof getSearch>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSearch>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSearch>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSearchQueryResult = NonNullable<Awaited<ReturnType<typeof getSearch>>>;
export type GetSearchQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get search run with results
 */
export declare function useGetSearch<TData = Awaited<ReturnType<typeof getSearch>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSearch>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List recent searches
 */
export declare const getListSearchesUrl: () => string;
export declare const listSearches: (options?: RequestInit) => Promise<SearchRun[]>;
export declare const getListSearchesQueryKey: () => readonly ["/api/searches"];
export declare const getListSearchesQueryOptions: <TData = Awaited<ReturnType<typeof listSearches>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSearches>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSearches>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSearchesQueryResult = NonNullable<Awaited<ReturnType<typeof listSearches>>>;
export type ListSearchesQueryError = ErrorType<unknown>;
/**
 * @summary List recent searches
 */
export declare function useListSearches<TData = Awaited<ReturnType<typeof listSearches>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSearches>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Save a price result
 */
export declare const getSaveResultUrl: () => string;
export declare const saveResult: (saveResultRequest: SaveResultRequest, options?: RequestInit) => Promise<SavedResult>;
export declare const getSaveResultMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveResult>>, TError, {
        data: BodyType<SaveResultRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof saveResult>>, TError, {
    data: BodyType<SaveResultRequest>;
}, TContext>;
export type SaveResultMutationResult = NonNullable<Awaited<ReturnType<typeof saveResult>>>;
export type SaveResultMutationBody = BodyType<SaveResultRequest>;
export type SaveResultMutationError = ErrorType<unknown>;
/**
 * @summary Save a price result
 */
export declare const useSaveResult: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveResult>>, TError, {
        data: BodyType<SaveResultRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof saveResult>>, TError, {
    data: BodyType<SaveResultRequest>;
}, TContext>;
/**
 * @summary List all saved results
 */
export declare const getListSavedResultsUrl: () => string;
export declare const listSavedResults: (options?: RequestInit) => Promise<SavedResult[]>;
export declare const getListSavedResultsQueryKey: () => readonly ["/api/saved-results"];
export declare const getListSavedResultsQueryOptions: <TData = Awaited<ReturnType<typeof listSavedResults>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSavedResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSavedResults>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSavedResultsQueryResult = NonNullable<Awaited<ReturnType<typeof listSavedResults>>>;
export type ListSavedResultsQueryError = ErrorType<unknown>;
/**
 * @summary List all saved results
 */
export declare function useListSavedResults<TData = Awaited<ReturnType<typeof listSavedResults>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSavedResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Remove a saved result
 */
export declare const getDeleteSavedResultUrl: (id: number) => string;
export declare const deleteSavedResult: (id: number, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteSavedResultMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSavedResult>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteSavedResult>>, TError, {
    id: number;
}, TContext>;
export type DeleteSavedResultMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSavedResult>>>;
export type DeleteSavedResultMutationError = ErrorType<unknown>;
/**
 * @summary Remove a saved result
 */
export declare const useDeleteSavedResult: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSavedResult>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteSavedResult>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Add a manual review/tag to a result
 */
export declare const getAddManualReviewUrl: () => string;
export declare const addManualReview: (manualReviewRequest: ManualReviewRequest, options?: RequestInit) => Promise<ManualReview>;
export declare const getAddManualReviewMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addManualReview>>, TError, {
        data: BodyType<ManualReviewRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addManualReview>>, TError, {
    data: BodyType<ManualReviewRequest>;
}, TContext>;
export type AddManualReviewMutationResult = NonNullable<Awaited<ReturnType<typeof addManualReview>>>;
export type AddManualReviewMutationBody = BodyType<ManualReviewRequest>;
export type AddManualReviewMutationError = ErrorType<unknown>;
/**
 * @summary Add a manual review/tag to a result
 */
export declare const useAddManualReview: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addManualReview>>, TError, {
        data: BodyType<ManualReviewRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addManualReview>>, TError, {
    data: BodyType<ManualReviewRequest>;
}, TContext>;
/**
 * @summary List all domain rules
 */
export declare const getListDomainRulesUrl: () => string;
export declare const listDomainRules: (options?: RequestInit) => Promise<DomainRule[]>;
export declare const getListDomainRulesQueryKey: () => readonly ["/api/domain-rules"];
export declare const getListDomainRulesQueryOptions: <TData = Awaited<ReturnType<typeof listDomainRules>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDomainRules>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDomainRules>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDomainRulesQueryResult = NonNullable<Awaited<ReturnType<typeof listDomainRules>>>;
export type ListDomainRulesQueryError = ErrorType<unknown>;
/**
 * @summary List all domain rules
 */
export declare function useListDomainRules<TData = Awaited<ReturnType<typeof listDomainRules>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDomainRules>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a domain rule (prefer or block)
 */
export declare const getCreateDomainRuleUrl: () => string;
export declare const createDomainRule: (createDomainRuleRequest: CreateDomainRuleRequest, options?: RequestInit) => Promise<DomainRule>;
export declare const getCreateDomainRuleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDomainRule>>, TError, {
        data: BodyType<CreateDomainRuleRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createDomainRule>>, TError, {
    data: BodyType<CreateDomainRuleRequest>;
}, TContext>;
export type CreateDomainRuleMutationResult = NonNullable<Awaited<ReturnType<typeof createDomainRule>>>;
export type CreateDomainRuleMutationBody = BodyType<CreateDomainRuleRequest>;
export type CreateDomainRuleMutationError = ErrorType<unknown>;
/**
 * @summary Create a domain rule (prefer or block)
 */
export declare const useCreateDomainRule: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDomainRule>>, TError, {
        data: BodyType<CreateDomainRuleRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createDomainRule>>, TError, {
    data: BodyType<CreateDomainRuleRequest>;
}, TContext>;
/**
 * @summary Delete a domain rule
 */
export declare const getDeleteDomainRuleUrl: (id: number) => string;
export declare const deleteDomainRule: (id: number, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteDomainRuleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDomainRule>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteDomainRule>>, TError, {
    id: number;
}, TContext>;
export type DeleteDomainRuleMutationResult = NonNullable<Awaited<ReturnType<typeof deleteDomainRule>>>;
export type DeleteDomainRuleMutationError = ErrorType<unknown>;
/**
 * @summary Delete a domain rule
 */
export declare const useDeleteDomainRule: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDomainRule>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteDomainRule>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List saved search presets
 */
export declare const getListSearchPresetsUrl: () => string;
export declare const listSearchPresets: (options?: RequestInit) => Promise<SearchPreset[]>;
export declare const getListSearchPresetsQueryKey: () => readonly ["/api/search-presets"];
export declare const getListSearchPresetsQueryOptions: <TData = Awaited<ReturnType<typeof listSearchPresets>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSearchPresets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSearchPresets>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSearchPresetsQueryResult = NonNullable<Awaited<ReturnType<typeof listSearchPresets>>>;
export type ListSearchPresetsQueryError = ErrorType<unknown>;
/**
 * @summary List saved search presets
 */
export declare function useListSearchPresets<TData = Awaited<ReturnType<typeof listSearchPresets>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSearchPresets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Save a search preset
 */
export declare const getCreateSearchPresetUrl: () => string;
export declare const createSearchPreset: (createSearchPresetRequest: CreateSearchPresetRequest, options?: RequestInit) => Promise<SearchPreset>;
export declare const getCreateSearchPresetMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSearchPreset>>, TError, {
        data: BodyType<CreateSearchPresetRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSearchPreset>>, TError, {
    data: BodyType<CreateSearchPresetRequest>;
}, TContext>;
export type CreateSearchPresetMutationResult = NonNullable<Awaited<ReturnType<typeof createSearchPreset>>>;
export type CreateSearchPresetMutationBody = BodyType<CreateSearchPresetRequest>;
export type CreateSearchPresetMutationError = ErrorType<unknown>;
/**
 * @summary Save a search preset
 */
export declare const useCreateSearchPreset: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSearchPreset>>, TError, {
        data: BodyType<CreateSearchPresetRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSearchPreset>>, TError, {
    data: BodyType<CreateSearchPresetRequest>;
}, TContext>;
/**
 * @summary Delete a search preset
 */
export declare const getDeleteSearchPresetUrl: (id: number) => string;
export declare const deleteSearchPreset: (id: number, options?: RequestInit) => Promise<SuccessResponse>;
export declare const getDeleteSearchPresetMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSearchPreset>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteSearchPreset>>, TError, {
    id: number;
}, TContext>;
export type DeleteSearchPresetMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSearchPreset>>>;
export type DeleteSearchPresetMutationError = ErrorType<unknown>;
/**
 * @summary Delete a search preset
 */
export declare const useDeleteSearchPreset: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSearchPreset>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteSearchPreset>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Export search results as JSON
 */
export declare const getExportResultsUrl: (searchId: number, params?: ExportResultsParams) => string;
export declare const exportResults: (searchId: number, params?: ExportResultsParams, options?: RequestInit) => Promise<ExportData>;
export declare const getExportResultsQueryKey: (searchId: number, params?: ExportResultsParams) => readonly [`/api/export/${number}`, ...ExportResultsParams[]];
export declare const getExportResultsQueryOptions: <TData = Awaited<ReturnType<typeof exportResults>>, TError = ErrorType<unknown>>(searchId: number, params?: ExportResultsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof exportResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof exportResults>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ExportResultsQueryResult = NonNullable<Awaited<ReturnType<typeof exportResults>>>;
export type ExportResultsQueryError = ErrorType<unknown>;
/**
 * @summary Export search results as JSON
 */
export declare function useExportResults<TData = Awaited<ReturnType<typeof exportResults>>, TError = ErrorType<unknown>>(searchId: number, params?: ExportResultsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof exportResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get overall usage statistics
 */
export declare const getGetStatsUrl: () => string;
export declare const getStats: (options?: RequestInit) => Promise<Stats>;
export declare const getGetStatsQueryKey: () => readonly ["/api/stats"];
export declare const getGetStatsQueryOptions: <TData = Awaited<ReturnType<typeof getStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getStats>>>;
export type GetStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get overall usage statistics
 */
export declare function useGetStats<TData = Awaited<ReturnType<typeof getStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get map-ready location data for search results
 */
export declare const getGetMapDataUrl: (searchId: number) => string;
export declare const getMapData: (searchId: number, options?: RequestInit) => Promise<MapPin[]>;
export declare const getGetMapDataQueryKey: (searchId: number) => readonly [`/api/results/${number}/map`];
export declare const getGetMapDataQueryOptions: <TData = Awaited<ReturnType<typeof getMapData>>, TError = ErrorType<unknown>>(searchId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMapData>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMapData>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMapDataQueryResult = NonNullable<Awaited<ReturnType<typeof getMapData>>>;
export type GetMapDataQueryError = ErrorType<unknown>;
/**
 * @summary Get map-ready location data for search results
 */
export declare function useGetMapData<TData = Awaited<ReturnType<typeof getMapData>>, TError = ErrorType<unknown>>(searchId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMapData>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map