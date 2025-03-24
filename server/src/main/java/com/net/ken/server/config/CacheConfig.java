package com.net.ken.server.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String USER_CACHE = "userCache";
    public static final String PROJECT_CACHE = "projectCache";
    public static final String TASK_CACHE = "taskCache";
    public static final String NOTIFICATION_CACHE = "notificationCache";
    
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCacheNames(Arrays.asList(
                USER_CACHE,
                PROJECT_CACHE,
                TASK_CACHE,
                NOTIFICATION_CACHE
        ));
        cacheManager.setCaffeine(caffeineConfig());
        return cacheManager;
    }
    
    private Caffeine<Object, Object> caffeineConfig() {
        return Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .initialCapacity(100)
                .maximumSize(500);
    }
} 