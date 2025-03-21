package com.net.ken.server.aspect;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
public class LoggingAspect {
    
    @Pointcut("within(@org.springframework.stereotype.Repository *)" +
            " || within(@org.springframework.stereotype.Service *)" +
            " || within(@org.springframework.web.bind.annotation.RestController *)")
    public void springBeanPointcut() {
        // Pointcut cho Spring beans
    }

    @Pointcut("within(com.net.ken.server..*)")
    public void applicationPackagePointcut() {
        // Pointcut cho tất cả các package trong ứng dụng
    }

    @Around("applicationPackagePointcut() && springBeanPointcut()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        Logger log = LoggerFactory.getLogger(joinPoint.getSignature().getDeclaringTypeName());
        if (log.isDebugEnabled()) {
            log.debug("Enter: {}.{}() với tham số = {}", 
                    joinPoint.getSignature().getDeclaringTypeName(),
                    joinPoint.getSignature().getName(), 
                    Arrays.toString(joinPoint.getArgs()));
        }
        try {
            Object result = joinPoint.proceed();
            if (log.isDebugEnabled()) {
                log.debug("Exit: {}.{}() với kết quả = {}", 
                        joinPoint.getSignature().getDeclaringTypeName(),
                        joinPoint.getSignature().getName(), 
                        result);
            }
            return result;
        } catch (IllegalArgumentException e) {
            log.error("Tham số không hợp lệ: {} trong {}.{}()", 
                    Arrays.toString(joinPoint.getArgs()),
                    joinPoint.getSignature().getDeclaringTypeName(), 
                    joinPoint.getSignature().getName());
            throw e;
        }
    }

    @AfterThrowing(pointcut = "applicationPackagePointcut() && springBeanPointcut()", throwing = "e")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable e) {
        Logger log = LoggerFactory.getLogger(joinPoint.getSignature().getDeclaringTypeName());
        log.error("Exception trong {}.{}() với nguyên nhân = {}", 
                joinPoint.getSignature().getDeclaringTypeName(),
                joinPoint.getSignature().getName(), 
                e.getCause() != null ? e.getCause() : "NULL");
        log.error("Stack trace: ", e);
    }
} 