package com.net.ken.server.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Cấu hình Redis chỉ được áp dụng khi spring.data.redis.enabled=true
 */
@Configuration
@ConditionalOnProperty(name = "spring.data.redis.enabled", havingValue = "true")
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Sử dụng StringRedisSerializer cho keys
        template.setKeySerializer(new StringRedisSerializer());
        
        // Sử dụng Jackson2JsonRedisSerializer cho values
        template.setValueSerializer(new Jackson2JsonRedisSerializer<>(Object.class));
        
        return template;
    }
} 